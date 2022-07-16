import logger, { addLoggerContext } from "@common/logger";
import { Token } from "@custom/types/spotify";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from "@aws-sdk/client-eventbridge";
import { dynamoddbClient, ScheduleItem } from "@common/dynamodb";
import { Lambda } from "@aws-sdk/client-lambda";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { SortParameters } from "../sort/handler";
import { nanoid } from "nanoid";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { lambdaResponse } from "@common/lambda";
import Workflow from "@custom/types/workflow";

const eventBridge = new EventBridgeClient({ region: "eu-west-2" });
const lambda = new Lambda({ region: "eu-west-2" });

export type ScheduleBodyParameters = {
  name: string;
  operation: "sort" | "workflow";
  operationParameters:
    | {
        playlistId: string;
        property: SortParameters["property"];
        order: SortParameters["order"];
      }
    | Workflow;
  cadence: "once" | "daily" | "weekly" | "monthly" | "yearly";
  timestamp: string;
  spotify: Partial<Token>;
};

export interface ScheduleRuleInput {
  id: string;
  user: string;
  rule: string;
}

const spotifyTokensSchema: JSONSchemaType<Token> = {
  $id: "/SpotifyTokens",
  type: "object",
  properties: {
    access_token: { type: "string" },
    token_type: { type: "string" },
    scope: { type: "string" },
    expires_in: { type: "number" },
    refresh_token: { type: "string" },
  },
  required: ["access_token", "refresh_token"],
};

const scheduleBodyParameterSchema: JSONSchemaType<ScheduleBodyParameters> = {
  $id: "/ScheduleBodyParameters",
  type: "object",
  properties: {
    name: { type: "string" },
    operation: { type: "string", enum: ["sort", "workflow"] },
    operationParameters: { type: "object", required: [] },
    cadence: { type: "string", enum: ["once", "daily", "weekly", "monthly", "yearly"] },
    timestamp: { type: "string", format: "date-time" },
    spotify: { $ref: "/SpotifyTokens" },
  },
  required: ["name", "operation", "operationParameters", "cadence", "timestamp", "spotify"],
  additionalProperties: false,
};

const ajv = new Ajv({ schemas: [spotifyTokensSchema] });
addFormats(ajv); // Add date-time formats for Date checking
const validateScheduleParameters = ajv.compile(scheduleBodyParameterSchema);

export function generateCronTabFromTimestamp(
  cadence: ScheduleBodyParameters["cadence"],
  timestamp: Date,
) {
  // Default setup to 'monthly' cadence
  const minutes = timestamp.getMinutes();
  const hours = timestamp.getHours();
  let dayOfMonth = `${timestamp.getDate()}`;
  let month = "*";
  let dayOfWeek = "?";
  let year = `${timestamp.getFullYear()}`;

  if (cadence === "once") {
    month = `${timestamp.getMonth() + 1}`;
  } else if (cadence === "daily") {
    dayOfMonth = "*";
  } else if (cadence === "weekly") {
    dayOfMonth = "?";
    dayOfWeek = `${timestamp.getDay() + 1}`;
  } else if (cadence === "yearly") {
    month = `${timestamp.getMonth() + 1}`;
    year = "*";
  }

  return `cron(${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek} ${year})`;
}

/**
 * Lambda to create a schedule.
 * Called with GET <api>/schedules/create
 *
 * @param event The API Gateway Event.
 * @returns An API Gateway Proxy Handler Response Body.
 */
export default async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { context } = addLoggerContext(logger, event);
  const user = context.user;

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  if (!user) {
    logger.info("No User identified for request");
    return lambdaResponse(400, "Missing user identifier");
  }

  if (!event.body) {
    return lambdaResponse(400, "Missing body parameters");
  }

  // Validate request body
  const scheduleParameters = JSON.parse(event.body) as ScheduleBodyParameters;
  const isValidScheduleBody = validateScheduleParameters(scheduleParameters);
  if (!isValidScheduleBody) {
    logger.info("Invalid body parameters", validateScheduleParameters.errors);
    return lambdaResponse(400, "Invalid body parameters");
  }

  // Generate cron expression from cadence/timestamp
  const scheduleId = nanoid();
  const { operation, cadence, timestamp } = scheduleParameters;
  const scheduleExpression = generateCronTabFromTimestamp(cadence, new Date(timestamp));
  const ruleParams = {
    Name: `schedule-rule-${scheduleId}`,
    ScheduleExpression: scheduleExpression,
    Description: `${operation} ${cadence} from ${timestamp} for user (${user})`,
  };

  // Create EventBridge Rule
  const putRule = new PutRuleCommand(ruleParams);
  const rule = await eventBridge.send(putRule);
  logger.info("Created rule", { rule: { name: ruleParams.Name, arn: rule.RuleArn } });

  if (!rule.RuleArn) {
    logger.error("Failed to create rule", rule);
    return lambdaResponse(500, "Failed to create rule");
  }

  // Add permission to rule to trigger lambda
  const permissionParams = {
    Action: "lambda:InvokeFunction",
    FunctionName: `amplified-tools-api-${process.env.STAGE}-schedule-runner`,
    Principal: "events.amazonaws.com",
    StatementId: ruleParams.Name,
    SourceArn: rule.RuleArn,
  };
  await lambda.addPermission(permissionParams);
  logger.info("Added permission to run rule to Lambda runner");

  // Add Input to DynamoDB schedule table and pass id to target rule input
  const scheduleInput: ScheduleRuleInput = {
    id: scheduleId,
    user: user,
    rule: ruleParams.Name,
  };

  const scheduleItem: ScheduleItem = {
    id: scheduleId,
    user: user,
    schedule: scheduleParameters.name,
    rule: ruleParams.Name,
    operation: operation,
    operationParameters: scheduleParameters.operationParameters,
    cadence: cadence,
    scheduledTimestamp: scheduleParameters.timestamp,
    spotify: scheduleParameters.spotify,
    runCount: 0,
    errorCount: 0,
    createdAt: new Date().toISOString(),
  };
  const putItem = new PutCommand({
    TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
    Item: scheduleItem,
  });
  const scheduleResponse = await dynamoddbClient.send(putItem);
  logger.info(`Added rule item (${scheduleId}) to schedules table`, scheduleResponse);

  // Add lambda as target of rule
  logger.info("Adding Target for Lambda", process.env.SCHEDULE_RUNNER_ARN);
  const targetParams = {
    Rule: ruleParams.Name,
    Targets: [
      {
        Id: `${ruleParams.Name}-target`,
        Arn: process.env.SCHEDULE_RUNNER_ARN,
        Input: JSON.stringify(scheduleInput),
      },
    ],
  };
  const putTargets = new PutTargetsCommand(targetParams);
  const result = await eventBridge.send(putTargets);
  logger.info("Added rule to EventBridge", result);

  logger.info("Successfully scheduled dynamic rule");
  return lambdaResponse(200, JSON.stringify(result));
};

import logger, { addLoggerContext } from "@common/logger";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient, ScheduleItem } from "@common/dynamodb";
import { lambdaResponse } from "@common/lambda";
import { generateCronTabFromTimestamp, ScheduleBodyParameters } from "./create";
import { EventBridgeClient, PutRuleCommand } from "@aws-sdk/client-eventbridge";
import { getSchedule } from "./get";

const eventBridge = new EventBridgeClient({ region: "eu-west-2" });

/**
 * Lambda to get a users schedule.
 * Called with PUT <api>/schedules/:scheduleId
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

  const scheduleId = event.pathParameters?.scheduleId;

  // Check for valid property and order parameters
  if (!scheduleId) {
    return lambdaResponse(400, "Missing or invalid path parameters");
  }

  if (!user) {
    logger.info("No User identified for request");
    return lambdaResponse(400, "Missing user identifier");
  }

  // Check for a spotify credentials
  if (!event.body) {
    return lambdaResponse(400, "Missing body parameters");
  }

  // TODO: Validate request body
  const scheduleParameters = JSON.parse(event.body) as ScheduleBodyParameters;

  // Get current schedule
  const currentSchedule = await getSchedule(scheduleId, user);
  if (!currentSchedule) {
    return lambdaResponse(404, "Missing schedule");
  }

  // Generate cron expression from cadence/timestamp
  const { operation, cadence, timestamp } = scheduleParameters;
  const scheduleExpression = generateCronTabFromTimestamp(cadence, new Date(timestamp));
  const ruleParams = {
    Name: `schedule-rule-${scheduleId}`,
    ScheduleExpression: scheduleExpression,
    Description: `${operation} ${cadence} from ${timestamp} for user (${user})`,
  };

  // Update EventBridge Rule by Name
  const putRule = new PutRuleCommand(ruleParams);
  const rule = await eventBridge.send(putRule);
  logger.info("Updated rule", { rule: { name: ruleParams.Name, arn: rule.RuleArn } });

  if (!rule.RuleArn) {
    logger.error("Failed to update rule", rule);
    return lambdaResponse(500, "Failed to update rule");
  }

  // Put item overwrites all attributes with identical id, user
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
  logger.info(`Updated schedule (${scheduleId})`, scheduleResponse);

  logger.info("Successfully updated schedule");
  return lambdaResponse(200, "Successfully updated schedule");
};

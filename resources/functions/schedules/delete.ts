import logger, { addLoggerContext } from "@common/logger";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient } from "@common/dynamodb";
import { lambdaResponse } from "@common/lambda";
import { ScheduleRuleInput } from "./create";
import {
  DeleteRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
  RemoveTargetsCommand,
} from "@aws-sdk/client-eventbridge";
import { Lambda, RemovePermissionCommandInput } from "@aws-sdk/client-lambda";
import { getSchedule } from "./get";

const eventBridge = new EventBridgeClient({ region: "eu-west-2" });
const lambda = new Lambda({ region: "eu-west-2" });

/**
 * Deletes EventBridge rule and DynamoDB Schedule state
 * @param event (ScheduleRuleInput) schedule id, rule name and user id
 */
export async function deleteSchedule(event: ScheduleRuleInput) {
  logger.info("Deleting schedule");

  try {
    // Delete DynamoDB Schedule item
    const deleteItem = new DeleteCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      Key: { id: event.id, user: event.user },
    });
    const deleteScheduleRes = await dynamoddbClient.send(deleteItem);
    logger.info(`Deleted ${event.id} schedule`, deleteScheduleRes);

    // List all targets on rule
    const listTargets = new ListTargetsByRuleCommand({ Rule: event.rule });
    const listTargetsRes = await eventBridge.send(listTargets);

    if (listTargetsRes.Targets) {
      // Remove target from rule
      const removeTarget = new RemoveTargetsCommand({
        Rule: event.rule,
        Ids: listTargetsRes.Targets.map((t) => `${t.Id}`),
      });
      const removeTargetRes = await eventBridge.send(removeTarget);
      logger.info(`Deleted ${event.rule} EventBridge targets`, removeTargetRes);
    }

    // Delete EventBridge rule
    const deleteRule = new DeleteRuleCommand({ Name: event.rule });
    const deleteRuleRes = await eventBridge.send(deleteRule);
    logger.info(`Deleted ${event.rule} EventBridge rule`, deleteRuleRes);

    // Remove Lambda permission policy
    const permissionParams: RemovePermissionCommandInput = {
      FunctionName: `amplified-tools-api-${process.env.STAGE}-schedule-runner`,
      StatementId: event.rule,
    };
    await lambda.removePermission(permissionParams);
    logger.info("Removed permission to run rule from Lambda runner");
  } catch (error) {
    logger.error("Failed to delete schedule", error);
    return;
  }

  logger.info("Deleted schedule");
}

/**
 * Lambda to delete a users schedule.
 * Called with DELETE <api>/schedules/:scheduleId
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

  try {
    // Get rule name before deleting
    const schedule = await getSchedule(scheduleId, user);

    if (!schedule) {
      return lambdaResponse(404, "Missing schedule");
    }

    await deleteSchedule({ id: scheduleId, user, rule: schedule.rule });

    return lambdaResponse(200, "Deleted schedule");
  } catch (error) {
    logger.error("Failed to delete schedule", error);
    return lambdaResponse(500, "Failed to delete schedule");
  }
};

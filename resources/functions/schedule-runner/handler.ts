import logger, { LoggerContext } from "@common/logger";
import spotifyApi from "@common/spotify-api";
import { ScheduleRuleInput, ScheduleRuleItem } from "../schedules/handler";
import { sort } from "../sort/handler";
import {
  EventBridgeClient,
  DeleteRuleCommand,
  RemoveTargetsCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient } from "@common/dynamodb";
import { Lambda, RemovePermissionCommandInput } from "@aws-sdk/client-lambda";

const eventBridge = new EventBridgeClient({ region: "eu-west-2" });
const lambda = new Lambda({ region: "eu-west-2" });

/**
 * Deletes EventBridge rule and DynamoDB Schedule state
 * @param event (ScheduleRuleInput) schedule id, rule name and user id
 */
async function deleteSchedule(event: ScheduleRuleInput) {
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
 * Updates DynamoDB Schedule state after a successful run
 * @param schedule (ScheduleRuleItem)
 */
async function updateSchedule(schedule: ScheduleRuleItem) {
  try {
    // Increment run count of schedule
    const updateCount = new UpdateCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      Key: { id: schedule.id, user: schedule.user },
      UpdateExpression: "SET #count = :newCount",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":newCount": schedule.count + 1 },
    });
    const updateScheduleRes = await dynamoddbClient.send(updateCount);
    logger.info(`Updated ${schedule.id} schedule`, updateScheduleRes);
  } catch (error) {
    logger.error("Failed to update schedule", error);
    return;
  }
}

/**
 * Lambda to run a schedule from dynamic EventBridge rules.
 * @param event (ScheduleRuleInput) EventBridge Scheduled Event.
 * @returns void
 */
export default async (event: ScheduleRuleInput): Promise<void> => {
  // Add logger context
  const context: LoggerContext = {
    scheduleId: event.id,
    rule: event.rule,
    user: event.user,
  };

  logger.defaultMeta = {
    label: "schedule-runner",
    context,
  };

  logger.info("Scheduled rule event received", event);

  // Get rule state/params from DynamoDB schedules table
  try {
    const getItem = new GetCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      Key: { id: event.id, user: event.user },
    });
    logger.info("Getting schedule from DynamoDB", getItem);
    const scheduleResponse = await dynamoddbClient.send(getItem);
    const schedule = scheduleResponse.Item as ScheduleRuleItem;

    if (!schedule.spotify || !schedule.spotify.refresh_token) {
      logger.error("Failed to run scheduled event, missing spotify refresh token");
      await deleteSchedule(event);
      return;
    }

    // Access token is highly likely to be expired, immediately refresh and set new access token
    spotifyApi.setRefreshToken(schedule.spotify.refresh_token);
    const { body } = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(body.access_token);

    // Run Operation
    logger.info("Running schedule", schedule);
    try {
      if (schedule.operation === "sort") {
        const { playlistId, property, order } = schedule.operationParameters;
        await sort(playlistId, property, order);
      } else {
        logger.warn(`Unknown operation ${schedule.operation}`, schedule.operationParameters);
        await deleteSchedule(event);
        return;
      }
    } catch (error) {
      logger.error(`Failed to run operation ${schedule.operation}`, error);
      // On failure, delete the rule immediately
      await deleteSchedule(event);
      return;
    }

    logger.info(`Successfully completed scheduled run for rule ${schedule.rule}`);

    // Delete rule if expired
    if (schedule.cadence === "once") {
      logger.info("Schedule has expired");
      await deleteSchedule(event);
    } else {
      logger.info("Updating DynamoDB Schedule state");
      await updateSchedule(schedule);
    }
  } catch (error) {
    logger.error("Failed to run rule", error);
    await deleteSchedule(event);
    return;
  }
};

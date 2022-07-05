import logger, { LoggerContext } from "@common/logger";
import spotifyApi from "@common/spotify-api";
import { ScheduleRuleInput } from "../schedules/create";
import { sort } from "../sort/handler";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient, ScheduleItem } from "@common/dynamodb";
import { deleteSchedule } from "../schedules/delete";

/**
 * Updates DynamoDB Schedule state after a successful run
 * @param schedule (ScheduleItem)
 */
async function updateScheduleAttribute(
  schedule: ScheduleItem,
  attributeName: string,
  attributeValue: string | number | boolean | Record<string, unknown>,
) {
  try {
    // Increment run count of schedule
    const updateAttribute = new UpdateCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      Key: { id: schedule.id, user: schedule.user },
      UpdateExpression: "SET #attributeName = :newValue",
      ExpressionAttributeNames: { "#attributeName": attributeName },
      ExpressionAttributeValues: { ":newValue": attributeValue },
    });
    const updateScheduleRes = await dynamoddbClient.send(updateAttribute);
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
    const schedule = scheduleResponse.Item as ScheduleItem;

    if (!schedule.spotify || !schedule.spotify.refresh_token) {
      logger.error("Failed to run scheduled event, missing spotify refresh token");
      await updateScheduleAttribute(schedule, "errorCount", schedule.errorCount + 1);
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

        if (!playlistId) {
          logger.error("No Playlist ID provided", schedule.operationParameters);
          await updateScheduleAttribute(schedule, "errorCount", schedule.errorCount + 1);
          return;
        }

        await sort(playlistId, property, order);
      } else {
        logger.warn(`Unknown operation ${schedule.operation}`, schedule.operationParameters);
        await updateScheduleAttribute(schedule, "errorCount", schedule.errorCount + 1);
        return;
      }
    } catch (error) {
      logger.error(`Failed to run operation ${schedule.operation}`, error);
      await updateScheduleAttribute(schedule, "errorCount", schedule.errorCount + 1);
      return;
    }

    logger.info(`Successfully completed scheduled run for rule ${schedule.rule}`);

    // Delete rule if expired, eventually store state / disable
    if (schedule.cadence === "once") {
      logger.info("Schedule has expired");
      await deleteSchedule(event);
    } else {
      logger.info("Updating DynamoDB Schedule state");
      await updateScheduleAttribute(schedule, "runCount", schedule.runCount + 1);
    }
  } catch (error) {
    logger.error("Failed to run rule", error);
    await deleteSchedule(event);
    return;
  }
};

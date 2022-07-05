import logger, { addLoggerContext } from "@common/logger";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient, ScheduleItem } from "@common/dynamodb";
import { lambdaResponse } from "@common/lambda";

export async function getSchedule(id: string, user: string): Promise<ScheduleItem> {
  const getCommand = new GetCommand({
    TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
    Key: { id, user },
  });

  const getSchedulesRes = await dynamoddbClient.send(getCommand);
  return getSchedulesRes.Item as ScheduleItem;
}

/**
 * Lambda to list a users schedules.
 * Called with GET <api>/schedules
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

  try {
    const query = new QueryCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      IndexName: "user-index",
      KeyConditionExpression: "#user = :user",
      ExpressionAttributeNames: { "#user": "user" },
      ExpressionAttributeValues: { ":user": user },
    });

    const querySchedulesRes = await dynamoddbClient.send(query);
    logger.info(`Retrieved ${querySchedulesRes.Count} schedules for ${user}`);

    return lambdaResponse(200, JSON.stringify(querySchedulesRes.Items));
  } catch (error) {
    logger.error(`Failed to retrieve schedules for ${user}`, error);
    return lambdaResponse(500, "Failed to retrieve schedules");
  }
};

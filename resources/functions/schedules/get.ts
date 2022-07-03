import logger, { addLoggerContext } from "@common/logger";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoddbClient } from "@common/dynamodb";

/**
 * Lambda to list a users schedules.
 * Called with GET <api>/schedules
 *
 * @param event The API Gateway Event.
 * @returns An API Gateway Proxy Handler Response Body.
 */
export default async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  addLoggerContext(logger, event);

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  const user = event.requestContext.identity.user;
  if (!user) {
    logger.info("No User identified for request");
    return {
      statusCode: 400,
      body: "Missing user identifier",
    };
  }

  try {
    const query = new QueryCommand({
      TableName: `amplified-tools-api-${process.env.STAGE}-schedules-table`,
      IndexName: "user-index",
      KeyConditionExpression: "#user = :user",
      ExpressionAttributeNames: { "#user": "user" },
      ExpressionAttributeValues: { ":user": user },
    });

    const querySchedulesRes = await dynamoddbClient.send(query);
    logger.info(`Retrieved schedules for ${user}`, querySchedulesRes);

    return {
      statusCode: 200,
      body: JSON.stringify(querySchedulesRes.Items),
    };
  } catch (error) {
    logger.error(`Failed to retrieve schedules for ${user}`, error);
    return {
      statusCode: 500,
      body: "Failed to retrieve schedules",
    };
  }
};

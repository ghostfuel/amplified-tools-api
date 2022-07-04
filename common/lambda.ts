import { APIGatewayProxyResult } from "aws-lambda";

/**
 * Helper function to add CORS headers for functions that need them
 * @param statusCode number
 * @param body string
 * @param headers optional object
 */
export function lambdaResponse(
  statusCode: number,
  body: string,
  headers?: Record<string, string>,
): APIGatewayProxyResult {
  return {
    statusCode,
    body,
    headers: headers || {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
}

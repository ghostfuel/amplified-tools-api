import { lambdaResponse } from "@common/lambda";
import logger, { addLoggerContext } from "@common/logger";
import spotify from "@common/spotify-api";
import Workflow from "@custom/types/workflow";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import runSourceOperation from "@common/workflow/sources";
import runSelectorOperation from "@common/workflow/selectors";
import runSorterOperation from "@common/workflow/sorters";
import runFilterOperation from "@common/workflow/filters";
import runActionOperation from "@common/workflow/actions";

export async function runWorkflow(workflow: Workflow) {
  const { operations } = workflow;
  for (const operation of operations) {
    logger.info(`Running ${operation.operation} operation`, {
      type: operation.type,
      params: operation.params,
    });

    if (operation.operation === "source") {
      operation.results = await runSourceOperation(operation);
    }

    if (operation.operation === "selector") {
      // Keep Outputs in their respective results array
      const sources = operation?.inputs?.map((i) => operations[i].results);
      operation.results = await runSelectorOperation(operation, sources);
    }

    const tracks = operation.inputs.flatMap((i) => operations[i].results);
    if (operation.operation === "sorter") {
      operation.results = await runSorterOperation(operation, tracks);
    }

    if (operation.operation === "filter") {
      operation.results = await runFilterOperation(operation, tracks);
    }

    if (operation.operation === "action") {
      await runActionOperation(operation, tracks);
      operation.results = tracks;
    }
  }
}

/**
 * Lambda to run a workflow.
 * Called with POST <api>/workflow
 *
 * @param event The API Gateway Event.
 * @returns An API Gateway Proxy Handler Response Body.
 */
export default async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  addLoggerContext(logger, event);

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  // TODO: Implement JSON Schema or validation
  if (!event.body) {
    return lambdaResponse(400, "Missing body parameters");
  }

  try {
    const workflow = JSON.parse(event.body) as Workflow;

    if (!workflow.spotifyTokens?.access_token) {
      return lambdaResponse(400, "Missing spotify access token");
    }

    spotify.setAccessToken(workflow.spotifyTokens?.access_token);
    await runWorkflow(workflow);

    logger.info("Successfully completed workflow");
    return lambdaResponse(200, "Successfully completed workflow");
  } catch (error) {
    logger.error("Failed to run workflow", error);
    return lambdaResponse(500, "Failed to run workflow");
  }
}

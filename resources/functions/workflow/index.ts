import type { LambdaFunctionCustomIAM } from "@custom/types/serverless";
import { defaultUserPoolAuthorizer } from "../../api-gateway";

export const runWorkflow: LambdaFunctionCustomIAM = {
  name: "${self:service}-${self:provider.stage}-run-workflow",
  handler: "resources/functions/workflow/handler.default",
  description: "Run a workflow immediately for the requesting user",
  events: [
    {
      http: {
        method: "post",
        path: "workflow",
        cors: true,
        authorizer: defaultUserPoolAuthorizer,
      },
    },
  ],
  iamRoleStatementsName: "${self:service}-${self:provider.stage}-run-workflow-role",
  iamRoleStatements: [],
};

import type { LambdaFunctionCustomIAM } from "@custom/types/serverless";

export const scheduleRunner: LambdaFunctionCustomIAM = {
  name: "${self:service}-${self:provider.stage}-schedule-runner",
  handler: "resources/functions/schedule-runner/handler.default",
  description: "Run common amplified tools api functions from dynamic EventBridge schedules",
  timeout: 60 * 5, // 5 Minutes
  iamRoleStatementsName: "${self:service}-${self:provider.stage}-schedule-runner-role",
  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: ["events:DeleteRule", "events:ListTargetsByRule", "events:RemoveTargets"],
      Resource: "arn:aws:events:${self:provider.region}:${aws:accountId}:rule/schedule*",
    },
    {
      Effect: "Allow",
      Action: ["dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"],
      Resource: { "Fn::GetAtt": ["schedulesTable", "Arn"] },
    },
    {
      Effect: "Allow",
      Action: "lambda:RemovePermission",
      Resource:
        "arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:${self:service}-${self:provider.stage}-schedule-runner",
    },
  ],
};

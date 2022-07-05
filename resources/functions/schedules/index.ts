import type { LambdaFunctionCustomIAM } from "@custom/types/serverless";
import { defaultUserPoolAuthorizer } from "../../api-gateway";

export const createSchedule: LambdaFunctionCustomIAM = {
  name: "${self:service}-${self:provider.stage}-create-schedule",
  handler: "resources/functions/schedules/create.default",
  description: "Scheduler-as-a-service for scheduling Spotify API actions",
  events: [
    {
      http: {
        method: "post",
        path: "schedules/create",
        cors: {
          origin: "*",
          headers: [
            "Content-Type",
            "X-Amz-Date",
            "Authorization",
            "X-Api-Key",
            "X-Amz-Security-Token",
            "X-Amz-User-Agent",
            "X-Amzn-Trace-Id",
            "spotify",
          ],
          allowCredentials: false,
        },
        authorizer: defaultUserPoolAuthorizer,
      },
    },
  ],
  environment: {
    // SCHEDULE_RUNNER_ARN: { "Fn::GetAtt": ["ScheduleRunnerLambdaFunction", "Arn"] },
    SCHEDULE_RUNNER_ARN:
      // eslint-disable-next-line max-len
      "arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:${self:service}-${self:provider.stage}-schedule-runner",
  },
  iamRoleStatementsName: "${self:service}-${self:provider.stage}-create-schedule-role",
  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: ["events:PutRule", "events:PutTargets"],
      // TODO: This potentially isnt the right place? :rule/*?
      Resource: "arn:aws:events:${self:provider.region}:${aws:accountId}:event-bus/default",
    },
    {
      Effect: "Allow",
      Action: "dynamodb:PutItem",
      Resource: { "Fn::GetAtt": ["schedulesTable", "Arn"] },
    },
    {
      Effect: "Allow",
      Action: "lambda:AddPermission",
      Resource: { "Fn::GetAtt": ["ScheduleRunnerLambdaFunction", "Arn"] },
    },
  ],
};

export const getSchedules: LambdaFunctionCustomIAM = {
  name: "${self:service}-${self:provider.stage}-get-schedules",
  handler: "resources/functions/schedules/get.default",
  description: "List schedules for the requesting user",
  events: [
    {
      http: {
        method: "get",
        path: "schedules",
        cors: true,
        authorizer: defaultUserPoolAuthorizer,
      },
    },
  ],
  iamRoleStatementsName: "${self:service}-${self:provider.stage}-get-schedules-role",
  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: ["dynamodb:Query", "dynamodb:GetItem"],
      Resource: { "Fn::GetAtt": ["schedulesTable", "Arn"] },
    },
    {
      Effect: "Allow",
      Action: ["dynamodb:Query"],
      Resource: {
        // Combine table ARN with index for permission to query by index
        "Fn::Join": ["", [{ "Fn::GetAtt": ["schedulesTable", "Arn"] }, "/index/user-index"]],
      },
    },
  ],
};

export const deleteSchedule: LambdaFunctionCustomIAM = {
  name: "${self:service}-${self:provider.stage}-delete-schedule",
  handler: "resources/functions/schedules/delete.default",
  description: "Delete schedule for the requesting user",
  events: [
    {
      http: {
        method: "delete",
        path: "schedules/{scheduleId}",
        cors: true,
        authorizer: defaultUserPoolAuthorizer,
      },
    },
  ],
  iamRoleStatementsName: "${self:service}-${self:provider.stage}-delete-schedule-role",
  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: ["dynamodb:GetItem", "dynamodb:DeleteItem"],
      Resource: { "Fn::GetAtt": ["schedulesTable", "Arn"] },
    },
    {
      Effect: "Allow",
      Action: ["events:DeleteRule", "events:ListTargetsByRule", "events:RemoveTargets"],
      Resource: "arn:aws:events:${self:provider.region}:${aws:accountId}:rule/schedule*",
    },
    {
      Effect: "Allow",
      Action: "lambda:RemovePermission",
      Resource:
        "arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:${self:service}-${self:provider.stage}-schedule-runner",
    },
  ],
};

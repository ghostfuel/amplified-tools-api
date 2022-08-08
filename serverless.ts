import "dotenv/config";
import type { AWS } from "@serverless/typescript";

import { login, callback } from "./resources/functions/login";
import { sort } from "./resources/functions/sort";
import { createSchedule, getSchedule, getSchedules, deleteSchedule, updateSchedule } from "./resources/functions/schedules";
import { scheduleRunner } from "./resources/functions/schedule-runner";
import { runWorkflow } from "./resources/functions/workflow";
import cognito from "./resources/cognito";
import apiGateway from "./resources/api-gateway";
import dynamodb from "./resources/dynamodb";

const requiredEnvVars = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"];
if (!requiredEnvVars.every((v) => Object.prototype.hasOwnProperty.call(process.env, v))) {
  console.error("Missing required Environment Variable(s):", requiredEnvVars);
}

const isOffline = process.env.IS_OFFLINE === "true";

const serverlessConfiguration: AWS = {
  service: "amplified-tools-api",
  frameworkVersion: "3",
  package: {
    individually: true,
  },
  plugins: ["serverless-bundle", "serverless-offline", "serverless-iam-roles-per-function"],
  custom: {},
  provider: {
    name: "aws",
    deploymentMethod: "direct",
    runtime: "nodejs16.x",
    stage: "${opt:stage, 'dev'}",
    region: "eu-west-2",
    versionFunctions: false,
    logs: {
      restApi: true,
    },
    environment: {
      // Serverless Variables
      STAGE: "${self:provider.stage}",
      // Spotify Variables
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
      SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
      // API Gateway resources do not output their url e.g. "https://<ApiGatewayRestApi>.execute-api.eu-west-2.amazonaws.com/<stage>"
      API_REDIRECT_URI: isOffline ? "http://localhost:3000/${self:provider.stage}/callback" : {
        "Fn::Join": [
          "",
          [
            "https://",
            { Ref: "ApiGatewayRestApi" },
            ".execute-api.",
            "${self:provider.region}",
            ".",
            { Ref: "AWS::URLSuffix" },
            "/${self:provider.stage}/callback",
          ],
        ],
      },
      CLIENT_REDIRECT_URI: isOffline
        ? "http://localhost:3001/"
        : "https://www.amplified.tools/",
      PKCE_ENABLED: process.env.PKCE_ENABLED || "false",
    },
  },
  functions: {
    login,
    callback,
    sort,
    createSchedule,
    getSchedule,
    getSchedules,
    deleteSchedule,
    updateSchedule,
    scheduleRunner,
    runWorkflow,
  },
  resources: {
    Resources: {
      ...cognito.Resources,
      ...apiGateway.Resources,
      ...dynamodb.Resources,
    },
    Outputs: {
      ...cognito.Outputs,
      ...dynamodb.Outputs,
    },
  },
};

module.exports = serverlessConfiguration;

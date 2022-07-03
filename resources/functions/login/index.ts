import type { LambdaFunction } from "@custom/types/serverless";

export const login: LambdaFunction = {
  handler: "resources/functions/login/handler.login",
  description: "Login to spotify account and get an access token.",
  events: [
    {
      http: {
        method: "get",
        path: "login",
        cors: true,
      },
    },
  ],
};

export const callback: LambdaFunction = {
  handler: "resources/functions/login/handler.callback",
  description: "Callback to spotify authorization to get an access token.",
  events: [
    {
      http: {
        method: "get",
        path: "callback",
        cors: true,
      },
    },
  ],
};

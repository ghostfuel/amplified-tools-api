import type { LambdaFunction } from "@custom/types/serverless";
import { defaultUserPoolAuthorizer } from "../../api-gateway";

export const sort: LambdaFunction = {
  handler: "resources/functions/sort/handler.default",
  description: "Sort playlists by property",
  events: [
    {
      http: {
        method: "get",
        path: "playlist/{playlistId}/sort",
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
};

import { APIGatewayEvent } from "aws-lambda";

export const generateApiGatewayEvent = (seed?: Partial<APIGatewayEvent>): APIGatewayEvent => ({
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "test",
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "",
    apiId: "",
    authorizer: null,
    protocol: "",
    httpMethod: "",
    identity: {
      accessKey: "",
      accountId: "",
      apiKey: "",
      apiKeyId: "",
      caller: "",
      clientCert: null,
      cognitoAuthenticationProvider: "",
      cognitoAuthenticationType: "",
      cognitoIdentityId: "",
      cognitoIdentityPoolId: "",
      principalOrgId: "",
      sourceIp: "test.test",
      user: "test",
      userAgent: "",
      userArn: "",
    },
    path: "",
    stage: "",
    requestId: "",
    requestTimeEpoch: 0,
    resourceId: "",
    resourcePath: "",
  },
  resource: "test",
  ...seed,
});

export const apiGatewayUserPoolAuthorizer = {
  Type: "AWS::ApiGateway::Authorizer",
  Properties: {
    Name: "${self:service}-${self:provider.stage}-user-pool-authorizer",
    Type: "COGNITO_USER_POOLS",
    IdentitySource: "method.request.header.Authorization",
    RestApiId: {
      Ref: "ApiGatewayRestApi",
    },
    ProviderARNs: [
      {
        "Fn::GetAtt": ["cognitoUserPool", "Arn"],
      },
    ],
  },
};

// Serverless framwork 'cors' on Functions doesn't appear to add the appropriate headers to gateway responses
export const apiGatewayResponseDefault4XX = {
  Type: "AWS::ApiGateway::GatewayResponse",
  Properties: {
    ResponseParameters: {
      "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
      "gatewayresponse.header.Access-Control-Allow-Headers":
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token','spotify'",
      "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
    },
    ResponseType: "DEFAULT_4XX",
    RestApiId: {
      Ref: "ApiGatewayRestApi",
    },
  },
};

// Helpers
export const defaultUserPoolAuthorizer = {
  type: "COGNITO_USER_POOLS",
  authorizerId: { Ref: "apiGatewayUserPoolAuthorizer" },
};

export default {
  Resources: { apiGatewayUserPoolAuthorizer, apiGatewayResponseDefault4XX },
  Outputs: {},
};

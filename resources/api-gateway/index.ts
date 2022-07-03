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

// Helpers
export const defaultUserPoolAuthorizer = {
  type: "COGNITO_USER_POOLS",
  authorizerId: { Ref: "apiGatewayUserPoolAuthorizer" },
};

export default {
  Resources: { apiGatewayUserPoolAuthorizer },
  Outputs: {},
};

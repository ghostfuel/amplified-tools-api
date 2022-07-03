export const cognitoUserPool = {
  Type: "AWS::Cognito::UserPool",
  Properties: {
    UserPoolName: "${self:service}-${self:provider.stage}-user-pool",
    UsernameAttributes: ["email"],
    AutoVerifiedAttributes: ["email"],
  },
};

export const cognitoUserPoolClient = {
  Type: "AWS::Cognito::UserPoolClient",
  Properties: {
    ClientName: "${self:service}-${self:provider.stage}-user-pool-client",
    UserPoolId: { Ref: "cognitoUserPool" },
    GenerateSecret: false,
  },
};

export default {
  Resources: {
    cognitoUserPool,
    cognitoUserPoolClient,
  },
  Outputs: {
    userPoolId: { Value: { Ref: "cognitoUserPool" } },
    userPoolClientId: { Value: { Ref: "cognitoUserPoolClient" } },
  },
};

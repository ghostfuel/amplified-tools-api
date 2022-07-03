import type { AWS } from "@serverless/typescript";

// Extract generic Function type from serverless config interface
export type LambdaFunction = NonNullable<AWS["functions"]>[0];
export interface LambdaFunctionCustomIAM extends LambdaFunction {
  iamRoleStatementsName: string;
  iamRoleStatements: AWS["provider"]["iamRoleStatements"];
}

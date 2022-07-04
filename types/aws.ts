export interface AWSCognitoIdTokenPayload {
  sub: string;
  aud: string;
  email_verified: boolean;
  token_use: string;
  auth_time: number;
  iss: string;
  "cognito:username": string;
  exp: number;
  given_name: string;
  iat: number;
  email: string;
}

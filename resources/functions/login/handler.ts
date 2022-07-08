import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import fetch from "node-fetch";
import * as randomstring from "randomstring";
import crypto from "crypto";
import base64url from "base64url";
import logger, { addLoggerContext } from "@common/logger";

// Spotify Auth Code Flow variables
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const apiRedirectUri = process.env.API_REDIRECT_URI;
const clientRedirectUri = process.env.CLIENT_REDIRECT_URI;
const pkceEnabled: boolean = process.env.PKCE_ENABLED === "true";

// TODO: Move Spotify types
type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
  error: string;
  error_description: string;
};

/**
 * Method to begin Spotify Login Flow. Redirects to Spotify Authorization Page.
 * Called with GET <api>/login.
 *
 * @param event The API Gateway Event.
 * @returns An API Gateway Proxy Handler Response Body.
 */
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  addLoggerContext(logger, event);

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-library-read",
    "user-library-modify",
    "user-top-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-follow-read",
    "user-follow-modify",
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-modify-playback-state",
    "user-read-recently-played",
  ];

  // Check environment variables are set
  if (!clientId || !scopes || !apiRedirectUri) {
    logger.error("Missing spotify credentials");
    return {
      statusCode: 500,
      body: "Something went wrong",
    };
  }

  const redirectParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes.join(" "),
    redirect_uri: apiRedirectUri,
    state: randomstring.generate(16),
  });

  // For Authorization with PKCE, a code challenge and method must be supplied
  if (pkceEnabled) {
    const code_verifier = randomstring.generate(128);
    const code_challenge = crypto.createHash("sha256").update(code_verifier).digest("base64");
    redirectParams.set("code_challenge_method", "S256");
    redirectParams.set("code_challenge", base64url.fromBase64(code_challenge));
  }

  return {
    statusCode: 301,
    headers: {
      Location: `https://accounts.spotify.com/authorize?${redirectParams.toString()}`,
    },
    body: "",
  };
};

/**
 * The callback API that is called after the user has authorized the application.
 * Exchanges the Spotify Access Code for an Access Token and returns that to client.
 *
 * @param event The API Gateway Event.
 * @returns An Api Gateawy Proxy Handler Response Body.
 */
export const callback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  addLoggerContext(logger, event);

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  const code = event.queryStringParameters?.code;
  const state = event.queryStringParameters?.state;

  // TODO: Handle a state mismatch better
  // Note: Might be nice to store 'state' in redis/memcached alongside 'code_verifier' (or dud values) for solving both problems
  if (!state || state.length !== 16 || !code) {
    const redirectParams = new URLSearchParams({
      error: "state_mismatch",
      state: `${state}`,
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${clientRedirectUri}?${redirectParams.toString()}`,
      },
      body: "State mismatch",
    };
  }

  // Check environment variables are set
  if (!clientId || !clientSecret || !apiRedirectUri) {
    logger.error("Missing spotify credentials");
    return {
      statusCode: 500,
      body: "Something went wrong",
    };
  }

  const requestParams = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: apiRedirectUri,
  });

  // For Authorization with PKCE, a code verifier should be shared
  if (pkceEnabled) {
    // TODO: this code_verifier won't be the same...
    const code_verifier = randomstring.generate(128);
    requestParams.set("client_id", clientId);
    requestParams.set("code_verifier", code_verifier);
  }

  // POST URL Form to retrieve token
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams(requestParams),
  });

  // Return token to user
  const tokenResponse = (await response.json()) as SpotifyTokenResponse;

  if (tokenResponse.error) {
    const redirectParams = new URLSearchParams({
      error: tokenResponse.error,
      errorDescription: tokenResponse.error_description,
    });

    return {
      statusCode: 302,
      body: "",
      headers: {
        Location: `${clientRedirectUri}?${redirectParams.toString()}`,
      },
    };
  }

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

  const redirectParams = new URLSearchParams({
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: expiresAt.toISOString(),
  });

  return {
    statusCode: 302,
    body: "",
    headers: {
      Location: `${clientRedirectUri}?${redirectParams.toString()}`,
    },
  };
};

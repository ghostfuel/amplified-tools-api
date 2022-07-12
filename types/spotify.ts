// eslint-disable-next-line spaced-comment
/// <reference types="spotify-api" />
// See Spotify Object Models: https://developer.spotify.com/documentation/web-api/reference/object-model/

export interface Token {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

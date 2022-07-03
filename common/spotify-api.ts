import SpotifyWebApi from "spotify-web-api-node";

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.API_REDIRECT_URI,
});

export default spotify;

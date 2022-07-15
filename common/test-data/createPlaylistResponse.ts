export const generateCreatePlaylistResponse = (
  id: string,
  name: string,
  playlistTracks: SpotifyApi.PlaylistTrackObject[],
  seed?: SpotifyApi.CreatePlaylistResponse,
): SpotifyApi.CreatePlaylistResponse => ({
  id: id,
  type: "playlist",
  uri: `spotify:playlist:${id}`,
  name: name,
  description: "test playlist generated by generateCreatePlaylistResponse",
  followers: { href: null, total: 0 },
  public: false,
  collaborative: false,
  href: `https://api.spotify.com/v1/playlists/${id}`,
  images: [],
  owner: {
    id: "testUserId",
    type: "user",
    uri: "spotify:usertestUserId",
    href: "https://api.spotify.com/v1/playlists/testUserId",
    external_urls: { spotify: "" },
    display_name: "Test User",
    followers: { href: null, total: 0 },
    images: [],
  },
  tracks: {
    href: `https://api.spotify.com/v1/playlists/${id}/tracks`,
    items: playlistTracks,
    limit: 0,
    next: null,
    offset: 0,
    previous: null,
    total: playlistTracks.length,
  },
  external_urls: { spotify: "" },
  snapshot_id: "0",
  ...seed,
});

export default generateCreatePlaylistResponse;

import { get } from "lodash";
import logger from "./logger";
import spotifyApi from "./spotify-api";

function removeArticle(string: string) {
  return string.toLowerCase().replace(/^(an?|the)\s/i, "");
}

export function parseUri(uri: string) {
  const pattern = new RegExp(/^spotify:([\w]+):([\w]+)$/);
  const match = pattern.exec(uri);

  if (!match) {
    throw new Error(`Malformed URI ${uri}`);
  }

  return { uri: match[0], type: match[1], id: match[2] };
}

export function buildSearchTerm(
  terms: { artist?: string; album?: string; track?: string; genre?: string },
  q?: string,
) {
  // artist,album,episode,local,playlist,user
  const searchTerms: string[] = [];

  // Add base query if supplied
  if (q) searchTerms.push(q);

  for (const [type, term] of Object.entries(terms)) {
    if (term) searchTerms.push(`${type}:${term}`);
  }

  return searchTerms.join(" ");
}

async function replaceLocalTrack(
  item: SpotifyApi.PlaylistTrackObject,
  market?: string,
): Promise<SpotifyApi.TrackObjectFull | undefined> {
  const track = item.track;

  const terms = {
    artist: track?.artists[0].name,
    album: track?.album.name,
    track: track?.name,
  };

  const searchString = buildSearchTerm(terms);
  const searchRes = await spotifyApi.search(searchString, ["track"], { market });
  const { tracks } = searchRes.body;

  // Return first presumably best matched item
  if (tracks && tracks.items && tracks.items.length > 0) {
    return tracks.items.shift();
  }
  // Couldn't replace track
  return;
}

export function removeLocalTracks(items: SpotifyApi.PlaylistTrackObject[]) {
  return items.filter((i) => !i.is_local);
}

export async function replaceAllLocalTracks(
  items: SpotifyApi.PlaylistTrackObject[],
  market?: string,
): Promise<SpotifyApi.PlaylistTrackObject[]> {
  const replaced: SpotifyApi.PlaylistTrackObject[] = [];

  for (const [idx, item] of items.entries()) {
    if (!item.is_local) continue;
    const newTrack = await replaceLocalTrack(item, market);
    if (newTrack) {
      items[idx].track = newTrack;
      items[idx].is_local = newTrack.is_local || false;
      replaced.push(item);
    }
  }

  return replaced;
}

function sortArtists<T>(collection: T[], seed?: object): T[] {
  const options = {
    propertyPath: "track.artists",
    removeArticles: true,
    ignoreWhitespace: true,
    extendedFields: ["track.album.name", "track.name"],
    ...seed,
  };

  // check for TrackObjectFull
  if (get(collection, "artists")) {
    options.propertyPath = options.propertyPath.replace("track.", "");
    options.extendedFields = options.extendedFields.map((s) => s.replace("track.", ""));
  }

  logger.debug("Sort Artists called", options);

  // Deep Clone...
  const clone = JSON.parse(JSON.stringify(collection)) as T[];

  clone.sort((a, b) => {
    const artistsA = get(a, options.propertyPath);
    const artistsB = get(b, options.propertyPath);

    if (!artistsA || !artistsB) {
      logger.error("Missing artists to compare", { artistsA, artistsB });
    }

    const artistA = artistsA
      .map((artist: SpotifyApi.ArtistObjectFull) => {
        let name = artist.name;
        name = options.removeArticles ? removeArticle(name) : name;
        return options.ignoreWhitespace ? name.replace(/\s/g, "") : name;
      })
      .join(" ");

    const artistB = artistsB
      .map((artist: SpotifyApi.ArtistObjectFull) => {
        let name = artist.name;
        name = options.removeArticles ? removeArticle(name) : name;
        return options.ignoreWhitespace ? name.replace(/\s/g, "") : name;
      })
      .join(" ");

    if (artistA < artistB) return -1;
    if (artistA > artistB) return 1;

    // Where Artists are the same, sort by extended fields
    for (const extendedField of options.extendedFields) {
      let extendedA = get(a, extendedField);
      let extendedB = get(b, extendedField);

      extendedA = options.removeArticles ? removeArticle(extendedA) : extendedA;
      extendedA = options.ignoreWhitespace ? extendedA.replace(/\s/g, "") : extendedA;
      extendedB = options.removeArticles ? removeArticle(extendedB) : extendedB;
      extendedB = options.ignoreWhitespace ? extendedB.replace(/\s/g, "") : extendedB;

      if (extendedA < extendedB) return -1;
      if (extendedA > extendedB) return 1;
    }

    // Preserve Order
    return 0;
  });

  return clone;
}

export function sortTracksByArtists(
  tracks: SpotifyApi.TrackObjectFull[],
  seed?: Record<string, unknown>,
) {
  const options = {
    propertyPath: "artists",
    extendedFields: ["album.name", "name"],
    ...seed,
  };
  return sortArtists(tracks, options);
}

export function sortPlaylistTracksByArtists(
  playlistTracks: SpotifyApi.PlaylistTrackObject[],
  seed?: Record<string, unknown>,
) {
  const options = {
    propertyPath: "track.artists",
    extendedFields: ["track.album.name", "track.name"],
    ...seed,
  };
  return sortArtists(playlistTracks, options);
}

export async function getAllPlaylistTracks(id: string, limit = Infinity) {
  const getTracksParams = { limit, offset: 0 };

  // Handle larger limits than API allows
  if (limit > 100) getTracksParams.limit = 100;

  let playlistTracksRes = await spotifyApi.getPlaylistTracks(id, getTracksParams);
  let playlistTracks = playlistTracksRes.body?.items;

  while (playlistTracksRes.body.next || playlistTracks.length === limit) {
    // Calculate next page size to satisfy limit
    const remaining = limit - getTracksParams.offset;
    getTracksParams.offset += remaining > 100 ? 100 : remaining;

    playlistTracksRes = await spotifyApi.getPlaylistTracks(id, getTracksParams);
    playlistTracks = playlistTracks.concat(playlistTracksRes.body?.items);
  }

  return playlistTracks;
}

export async function getAllUserPlaylists(limit = Infinity) {
  const getUserPlaylistsParams = { limit, offset: 0 };

  // Handle larger limits than API allows
  if (limit > 50) getUserPlaylistsParams.limit = 50;

  let userPlaylistsRes = await spotifyApi.getUserPlaylists(getUserPlaylistsParams);
  let userPlaylists = userPlaylistsRes.body?.items;

  while (userPlaylistsRes.body.next || userPlaylists.length === limit) {
    // Calculate next page size to satisfy limit
    const remaining = limit - getUserPlaylistsParams.offset;
    getUserPlaylistsParams.offset += remaining > 50 ? 50 : remaining;

    userPlaylistsRes = await spotifyApi.getUserPlaylists(getUserPlaylistsParams);
    userPlaylists = userPlaylists.concat(userPlaylistsRes.body?.items);
  }

  return userPlaylists;
}

// Fisher-yates shuffle
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
}

import logger from "@common/logger";
import api from "@common/spotify-api";
import {
  buildSearchTerm,
  getAllPlaylistTracks,
  parseUri,
  removeLocalTracks,
  replaceAllLocalTracks,
} from "@common/utils";
import { sortBy } from "lodash";
import SourceOperation, {
  AlbumSouceParams,
  AlbumSource,
  ArtistSouceParams,
  ArtistSource,
  PlaylistSource,
  PlaylistSourceParams,
  TrackSouceParams,
  TrackSource,
} from "@custom/types/workflow/sources";
import { UnknownOperation } from "@custom/types/workflow";

export default async function (operation: SourceOperation) {
  logger.info(`Getting '${operation.type}' type source`);

  if (!api.getAccessToken()) {
    throw new Error("Access Token has not been set.");
  }

  switch (operation.type) {
    case "album":
      const albumSource = operation as AlbumSource;
      return getAlbumSource(albumSource.params);
    case "artist":
      const artistSource = operation as ArtistSource;
      return getArtistSource(artistSource.params);
    case "track":
      const trackSource = operation as TrackSource;
      return getTrackSource(trackSource.params);
    case "playlist":
      const playlistSource = operation as PlaylistSource;
      return getPlaylistSource(playlistSource.params);
    default:
      const unknownOperation = operation as UnknownOperation;
      throw new Error(`Invalid Operation: ${unknownOperation.type}.`);
  }
}

export async function getArtistSource(
  params: ArtistSouceParams,
): Promise<SpotifyApi.TrackObjectFull[]> {
  const { uri, artist, country } = params;

  if (!(uri || artist) || !country) {
    throw Error("Must provide a uri or artist and country.");
  }

  // Check for URI and parse for Artist ID, otherwise perform search
  let id = "";
  if (uri) {
    id = parseUri(uri).id;
  } else if (artist) {
    const searchRes = await api.search(buildSearchTerm({ artist }), ["artist"], { limit: 1 });
    searchRes.body.artists?.items;

    const foundArtist = searchRes?.body.artists?.items[0];
    if (foundArtist) id = foundArtist.id;
  }

  if (!id) {
    logger.error("Failed to find Artist", params);
    return [];
  }

  const artistTopTracks = await api.getArtistTopTracks(id, country);

  return artistTopTracks.body.tracks;
}

export async function getAlbumSource(
  params: AlbumSouceParams,
): Promise<SpotifyApi.TrackObjectFull[]> {
  const { uri, artist, title } = params;

  if (!(uri || title)) {
    throw Error("Must supply at least one of; uri, title");
  }

  // Check for URI and parse for Album ID
  let id = "";
  if (uri) {
    id = parseUri(uri).id;
  } else if (title) {
    // otherwise search based on title and artist
    const searchRes = await api.search(buildSearchTerm({ album: title, artist }), ["album"], {
      limit: 1,
    });

    const album = searchRes?.body.albums?.items[0];
    if (album) id = album.id;
  }

  if (!id) {
    logger.error("Failed to find Album", params);
    return [];
  }

  // Album endpoints only give us Simplified Tracks, get the
  const album = await api.getAlbum(id);
  // TODO: need to page album response and chunk for albums > 20/50 tracks
  const trackRes = await api.getTracks(album.body.tracks.items.map((t) => t.id));

  return trackRes.body.tracks;
}

export async function getTrackSource(
  params: TrackSouceParams,
): Promise<SpotifyApi.TrackObjectFull[]> {
  const { uri, artist, title } = params;

  if (!(uri || title)) {
    throw Error("Must supply at least one of; uri, title");
  }

  // Perform Operation
  let result: SpotifyApi.TrackObjectFull[] = [];

  // Check for URI and parse for Track ID
  let id = "";
  if (uri) {
    id = parseUri(uri).id;
    const trackRes = await api.getTrack(id);
    result = [trackRes.body];
  } else if (title) {
    // otherwise search based on title and artist
    const searchRes = await api.search(buildSearchTerm({ track: title, artist }), ["track"], {
      limit: 1,
    });
    if (searchRes?.body.tracks?.items) result = [searchRes.body.tracks.items[0]];
    else {
      logger.error("Failed to find Track", params);
    }
  }

  return result;
}

// TODO: Implement a pre-sort order (Playlist Tracks by added_date, added_by etc.)
export async function getPlaylistSource(
  params: PlaylistSourceParams,
): Promise<SpotifyApi.TrackObjectFull[]> {
  const { uri, name, limit, orderByDateAdded } = params;
  const handleLocalTracks = params.handleLocalTracks || "remove";

  if (!(uri || name)) {
    throw Error("Must supply at least one of; uri, name");
  }

  let id;
  if (uri) {
    id = parseUri(uri).id;
  } else if (name) {
    // Search for the users playlist with that name
    // TODO: handle multiple pages
    const userPlaylists = await api.getUserPlaylists({ limit: 50 });
    id = userPlaylists.body.items.find((playlist) => playlist.name.includes(name))?.id;
  }

  if (!id) {
    logger.error("Failed to find Playlist", params);
    return [];
  }

  // Retrieve all
  let playlistTracks = await getAllPlaylistTracks(id, limit);

  // Replace/remove or skip over Local Tracks
  if (handleLocalTracks === "replace") {
    const localTracks = await replaceAllLocalTracks(playlistTracks);
    logger.info(`Replaced ${localTracks.length} local tracks.`);
  } else if (handleLocalTracks === "remove") {
    logger.info("Removing local tracks");
    playlistTracks = removeLocalTracks(playlistTracks);
  }

  // Check for a required order
  if (orderByDateAdded) {
    logger.info("Sorting by date added order");
    playlistTracks = sortBy(playlistTracks, "added_at");
    if (orderByDateAdded === "desc") playlistTracks.reverse();
  }

  // Normalise to TrackObjectFull[] and strip nulls, remove if fixed
  const tracks: SpotifyApi.TrackObjectFull[] = [];
  playlistTracks.forEach(({ track }, index) => {
    if (track) {
      tracks.push(track);
    } else {
      logger.warn("Null track found at index", index);
    }
  });

  logger.info(`Retrieved ${tracks.length} tracks from playlist ${id}`);
  return tracks;
}

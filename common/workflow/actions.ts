import logger from "@common/logger";
import spotifyApi from "@common/spotify-api";
import { getAllPlaylistTracks, getAllUserPlaylists, parseUri } from "@common/utils";
import { UnknownOperation } from "@custom/types/workflow";
import ActionOperation, { SaveAction, SaveActionParams } from "@custom/types/workflow/actions";
import { differenceWith, chunk } from "lodash";

export default async function (operation: ActionOperation, tracks: SpotifyApi.TrackObjectFull[]) {
  switch (operation.type) {
    case "save":
      const saveAction = operation as SaveAction;
      return runSaveAction(tracks, saveAction.params);
    default:
      const unknownOperation = operation as UnknownOperation;
      throw new Error(`Invalid Operation: ${unknownOperation.type}.`);
  }
}

export async function runSaveAction(
  tracks: SpotifyApi.TrackObjectFull[],
  params: SaveActionParams,
) {
  const { uri, name, append, reorder } = params;
  if (!(uri || name)) {
    throw new Error("Must supply at least one of; uri, name");
  }

  if (!spotifyApi.getAccessToken()) {
    throw new Error("AccessToken has not been set.");
  }

  // Parse URI for ID
  let id;
  if (uri) {
    id = parseUri(uri).id;
  } else if (name) {
    // Search for the users playlist with that name
    const userPlaylists = await getAllUserPlaylists();
    id = userPlaylists.find((playlist) => playlist.name === name)?.id;
  }

  // If we have no ID, make a new playlist with the supplied name
  if (!id && name) {
    const { description, isPublic, isCollaborative } = params;
    // TODO: Public and Profile visibility has changed, may need another call here to not show the playlist on a profile vs. public/private
    const newPlaylist = await spotifyApi.createPlaylist(name, {
      description,
      public: isPublic,
      collaborative: isCollaborative,
    });
    id = newPlaylist.body.id;
  }

  // Chunk tracks and save/update playlist
  if (id) {
    if (reorder) {
      return update(tracks, id);
    }
    return save(tracks, id, append);
  } else {
    throw new Error("Failed to retrieve a Playlist ID.");
  }
}

async function save(tracks: SpotifyApi.TrackObjectFull[], playlistId: string, append = false) {
  const chunked: SpotifyApi.TrackObjectFull[][] = chunk(tracks, 100); // 100 track limit per API call
  for (const [index, chunk] of chunked.entries()) {
    if (!append && index === 0) {
      // Overwrite any playlist tracks with the first 100 tracks
      await spotifyApi.replaceTracksInPlaylist(
        playlistId,
        chunk.map((i) => i.uri),
      );
    } else {
      await spotifyApi.addTracksToPlaylist(
        playlistId,
        chunk.map((i) => i.uri),
      );
    }
  }
}

async function update(tracks: SpotifyApi.TrackObjectFull[], playlistId: string) {
  let originalTracks: SpotifyApi.TrackObjectFull[] = [];

  // Get the original playlist order to guarantee adding new tracks
  const playlistTracks = await getAllPlaylistTracks(playlistId);
  originalTracks = playlistTracks.map((item) => item.track) as SpotifyApi.TrackObjectFull[];

  // Check if playlist is already ordered... Nasty.
  if (JSON.stringify(originalTracks) === JSON.stringify(tracks)) {
    logger.info(`Playlist (${playlistId}) already in order.`);
    return;
  }

  // If there are any tracks not present in the original playlist, add them first
  const newTracks = differenceWith(tracks, originalTracks, (a, b) => a.uri === b.uri);
  if (newTracks.length > 0) {
    logger.info(`Adding ${newTracks.length} new tracks to playlist before reordering`);
    await spotifyApi.addTracksToPlaylist(
      playlistId,
      newTracks.map((t) => t.uri),
    );
    originalTracks = originalTracks.concat(newTracks);
  }

  // Used to track changes to playlists
  type SnapshotOptions = {
    snapshot_id?: string | undefined;
  };
  const options: SnapshotOptions = { snapshot_id: undefined };
  for (const [position, track] of tracks.entries()) {
    const originalPos = originalTracks.findIndex((ot) => ot.uri === track.uri);
    // if Original Position and new Position are the same, skip.
    if (position === originalPos) continue;

    // Skip tracks that are not present in the playlist.
    if (originalPos === -1) {
      logger.warn("Track missing from playlist... skipping.");
    }

    try {
      // Reorder track and store new snapshot_id
      const reorderRes = await spotifyApi.reorderTracksInPlaylist(
        playlistId,
        originalPos,
        position,
        options,
      );
      options.snapshot_id = reorderRes.body.snapshot_id;
      // Update original tracks to reflect change
      originalTracks.splice(position, 0, originalTracks.splice(originalPos, 1)[0]);
    } catch (error) {
      logger.error("Failed to reorder track", error);
    }
  }
}

import logger, { addLoggerContext } from "@common/logger";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { get, orderBy } from "lodash";
import spotify from "@common/spotify-api";
import { getAllPlaylistTracks, sortPlaylistTracksByArtists } from "@common/utils";
import { lambdaResponse } from "@common/lambda";

export type SortParameters = {
  property: "added_at" | "track.artists" | "track.album.name" | "track.name";
  order: "asc" | "desc";
};

function isSortProperty(value?: string): value is SortParameters["property"] {
  if (!value) return false;
  return ["added_at", "track.artists", "track.album.name", "track.name"].includes(value);
}

function isSortOrder(value?: string): value is SortParameters["order"] {
  if (!value) return false;
  return ["asc", "desc"].includes(value);
}

/**
 * Sort a playlist by any property
 * @param playlistId string
 * @param property
 * @param order
 * @returns PlaylistTrackObject[]
 */
export const sort = async (
  playlistId: string,
  property: SortParameters["property"],
  order: SortParameters["order"],
): Promise<SpotifyApi.PlaylistTrackObject[]> => {
  // Get Playlist Tracks
  const items = await getAllPlaylistTracks(playlistId);

  // Sort according to supplied property (artist or lowercase any string property) and order
  const sorted = property.includes("artist")
    ? sortPlaylistTracksByArtists(items)
    : orderBy(items, [(item) => get(item, property).toLowerCase()]);
  if (order === "desc") sorted.reverse();

  // Check if already sorted...
  if (JSON.stringify(items) === JSON.stringify(sorted)) {
    logger.info(`Skipping, playlist (${playlistId}) already sorted.`);
    return items;
  }

  // Sort the playlist track by track
  let snapshotId;
  for (const [position, track] of sorted.entries()) {
    const originalPos = items.findIndex((item) => item.track?.uri === track.track?.uri);

    // if Original Position and new Position are the same, skip.
    if (position === originalPos) continue;

    // Reorder track and store new snapshot_id
    const reorderRes = await spotify.reorderTracksInPlaylist(playlistId, originalPos, position, {
      range_length: 1,
      snapshot_id: snapshotId,
    });
    snapshotId = reorderRes.body.snapshot_id;

    // Update local Arrays to reflect change
    items.splice(position, 0, items.splice(originalPos, 1)[0]);
  }

  logger.info(`Playlist (${playlistId}) sorted.`);
  return items;
};

/**
 * Lambda to sort a spotify playlist.
 * Called with GET <api>/playlist/{playlistId}/sort
 *
 * @param event The API Gateway Event.
 * @returns An API Gateway Proxy Handler Response Body.
 */
export default async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  addLoggerContext(logger, event);

  logger.info("Event received", {
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
  });

  const accessToken = event.headers?.spotify;
  const playlistId = event.pathParameters?.playlistId;
  const property = event?.queryStringParameters?.property;
  const order = event?.queryStringParameters?.order;

  // Check for a spotify access token
  if (!accessToken) {
    return lambdaResponse(401, "Unauthorized");
  }

  spotify.setAccessToken(accessToken);

  // Check for valid property and order parameters
  if (!playlistId || !isSortProperty(property) || !isSortOrder(order)) {
    return lambdaResponse(400, "Missing or invalid path parameters");
  }

  try {
    await sort(playlistId, property, order);

    return lambdaResponse(200, `Playlist (${playlistId}) sorted.`);
  } catch (error) {
    logger.error("Failed to sort playlist", error);

    return lambdaResponse(500, "Failed to sort playlist");
  }
};

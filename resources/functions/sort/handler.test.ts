import sortHandler, { sort } from "./handler";
import spotify from "@common/spotify-api";
import { playlistTracksResponse } from "@common/test-data";
import { generateApiGatewayEvent } from "@common/test-utils";
import { lambdaResponse } from "@common/lambda";

// Mock node-fetch just incase
jest.mock("node-fetch");
// const fetch = require("node-fetch");

describe("Sort handler", () => {
  const getPlaylistTracksMock = jest.spyOn(spotify, "getPlaylistTracks");
  const reorderTracksInPlaylistMock = jest.spyOn(spotify, "reorderTracksInPlaylist");

  // eslint-disable-next-line jest/no-focused-tests
  test("should sort a playlist of 5 items in ascending order by 'track.artists'", async () => {
    // Arrange: Test event with minimum required parameters
    const testSpotifyEvent = generateApiGatewayEvent({
      resource: "sort handler sort artists test",
      headers: { spotify: "test-token" },
      pathParameters: { playlistId: "test-playlist" },
      queryStringParameters: { property: "track.artists", order: "asc" },
    });

    // Arrange: reverse the order of the tracks to ensure a sort is performed
    const unsortedTracks = playlistTracksResponse.items.reverse();

    // Arrange: Mock first call
    getPlaylistTracksMock.mockResolvedValueOnce({
      body: {
        ...playlistTracksResponse,
        items: unsortedTracks,
      },
      headers: {},
      statusCode: 200,
    });

    // TODO: This needs to be smarter, retain state / order and resolve seperate values
    reorderTracksInPlaylistMock.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const response = await sortHandler(testSpotifyEvent);

    // Assert
    expect(response).toEqual(
      lambdaResponse(200, `Playlist (${testSpotifyEvent.pathParameters?.playlistId}) sorted.`),
    );
  });

  test("should sort a playlist of 5 items in descending order by 'track.name'", async () => {
    // Arrange: Test event with minimum required parameters
    const testSpotifyEvent = generateApiGatewayEvent({
      resource: "sort handler sort name test",
      headers: { spotify: "test-token" },
      pathParameters: { playlistId: "test-playlist" },
      queryStringParameters: { property: "track.name", order: "desc" },
    });

    // Arrange: reverse the order of the tracks to ensure a sort is performed
    const unsortedTracks = playlistTracksResponse.items.reverse();

    // Arrange: Mock first call
    getPlaylistTracksMock.mockResolvedValueOnce({
      body: {
        ...playlistTracksResponse,
        items: unsortedTracks,
      },
      headers: {},
      statusCode: 200,
    });

    // TODO: This needs to be smarter, retain state / order and resolve seperate values
    reorderTracksInPlaylistMock.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const response = await sortHandler(testSpotifyEvent);

    // Assert
    expect(response).toEqual(
      lambdaResponse(200, `Playlist (${testSpotifyEvent.pathParameters?.playlistId}) sorted.`),
    );
  });

  test("should sort a playlist of 5 items in descending order by 'added_at'", async () => {
    // Arrange: Test event with minimum required parameters
    const testSpotifyEvent = generateApiGatewayEvent({
      resource: "sort handler sort added_at test",
      headers: { spotify: "test-token" },
      pathParameters: { playlistId: "test-playlist" },
      queryStringParameters: { property: "added_at", order: "desc" },
    });

    // Arrange: reverse the order of the tracks to ensure a sort is performed
    const unsortedTracks = playlistTracksResponse.items.reverse();

    // Arrange: Mock first call
    getPlaylistTracksMock.mockResolvedValueOnce({
      body: {
        ...playlistTracksResponse,
        items: unsortedTracks,
      },
      headers: {},
      statusCode: 200,
    });

    // TODO: This needs to be smarter, retain state / order and resolve seperate values
    reorderTracksInPlaylistMock.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const response = await sortHandler(testSpotifyEvent);

    // Assert
    expect(response).toEqual(
      lambdaResponse(200, `Playlist (${testSpotifyEvent.pathParameters?.playlistId}) sorted.`),
    );
  });

  test("should error 401 on unauthorized when no spotify access token provided", async () => {
    // Arrange: Test event with minimum required parameters
    const testSpotifyEvent = generateApiGatewayEvent({
      resource: "Sort handler 401 test",
      headers: undefined,
      pathParameters: { playlistId: "test-playlist" },
      queryStringParameters: { property: "track.artists", order: "asc" },
    });

    const response = await sortHandler(testSpotifyEvent);

    // Assert
    expect(response).toEqual(lambdaResponse(401, "Unauthorized"));
  });

  test("should error 400 on invalid path parameters", async () => {
    // Arrange: Test event with minimum required parameters
    const testSpotifyEvent = generateApiGatewayEvent({
      resource: "Sort handler 400 test",
      headers: { spotify: "test-token" },
      pathParameters: { playlistId: "test-playlist" },
    });

    const response = await sortHandler(testSpotifyEvent);

    // Assert
    expect(response).toEqual(lambdaResponse(400, "Missing or invalid path parameters"));
  });

  test("should skip sorting an already sorted playlist", async () => {
    // Arrange: Mock first call
    getPlaylistTracksMock.mockResolvedValueOnce({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    const playlistId = "test-playlist";
    const property = "track.artists";
    const order = "asc";
    const sortedPlaylist = await sort(playlistId, property, order);

    // Assert
    expect(sortedPlaylist).toEqual(playlistTracksResponse.items);
    // No calls to Spotify API, would fail as there are no Jest mocks
  });
});

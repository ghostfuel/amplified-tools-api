import spotify from "@common/spotify-api";
import { generateCreatePlaylistResponse, playlistTracksResponse } from "@common/test-data";
import { userPlaylistsResponse } from "@common/test-data/userPlaylistsResponse";
import { ActionOperation, SaveAction } from "@custom/types/workflow/actions";
import { compact } from "lodash";
import runActionOperation from "./actions";

describe("runActionOperation", () => {
  test("should error when given an unknown operation", async () => {
    const unknownOperation = { type: "unknown" } as unknown as ActionOperation;
    try {
      await runActionOperation(unknownOperation, []);
    } catch (error) {
      expect(error.message).toEqual(`Invalid Operation: ${unknownOperation.type}.`);
    }
  });
});

describe("runSaveAction", () => {
  // Mock Spotify API Calls
  // Action
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  const getUserPlaylists = jest.spyOn(spotify, "getUserPlaylists");
  const createPlaylist = jest.spyOn(spotify, "createPlaylist");

  // Save
  const replaceTracksInPlaylist = jest.spyOn(spotify, "replaceTracksInPlaylist");
  const addTracksToPlaylist = jest.spyOn(spotify, "addTracksToPlaylist");

  // Update
  const getPlaylistTracks = jest.spyOn(spotify, "getPlaylistTracks");
  const reorderTracksInPlaylist = jest.spyOn(spotify, "reorderTracksInPlaylist");

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessTokenMock.mockReturnValue("test-token");
  });

  test("should save tracks to a new playlist", async () => {
    // Arrange
    getUserPlaylists.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    createPlaylist.mockResolvedValueOnce({
      body: generateCreatePlaylistResponse(
        "1",
        "New Test Playlist 1",
        playlistTracksResponse.items,
      ),
      headers: {},
      statusCode: 200,
    });

    replaceTracksInPlaylist.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const saveAction: SaveAction = {
      operation: "action",
      type: "save",
      params: { name: "New Test Playlist 1" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracksToSave: SpotifyApi.TrackObjectFull[] = compact(
      playlistTracksResponse.items.map((i) => i.track),
    );
    await runActionOperation(saveAction, tracksToSave);

    // Assert
    expect(getUserPlaylists).toHaveBeenCalledTimes(1);
    expect(createPlaylist).toHaveBeenCalledTimes(1);
    expect(createPlaylist).toHaveBeenCalledWith(saveAction.params.name);
    expect(addTracksToPlaylist).toHaveBeenCalledTimes(0);
    expect(reorderTracksInPlaylist).toHaveBeenCalledTimes(0);
    expect(replaceTracksInPlaylist).toHaveBeenCalledTimes(1);
    expect(replaceTracksInPlaylist).toHaveBeenCalledWith(
      "1",
      tracksToSave.map((i) => i.uri),
    );
  });

  test("should overwrite tracks in a playlist", async () => {
    // Arrange
    getUserPlaylists.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    replaceTracksInPlaylist.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const playlist = userPlaylistsResponse.items[0];
    const saveAction: SaveAction = {
      operation: "action",
      type: "save",
      params: { name: playlist.name },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracksToSave: SpotifyApi.TrackObjectFull[] = compact(
      playlistTracksResponse.items.map((i) => i.track),
    );
    await runActionOperation(saveAction, tracksToSave);

    // Assert
    expect(getUserPlaylists).toHaveBeenCalledTimes(1);
    expect(createPlaylist).toHaveBeenCalledTimes(0);
    expect(addTracksToPlaylist).toHaveBeenCalledTimes(0);
    expect(reorderTracksInPlaylist).toHaveBeenCalledTimes(0);
    expect(replaceTracksInPlaylist).toHaveBeenCalledTimes(1);
    expect(replaceTracksInPlaylist).toHaveBeenCalledWith(
      playlist.id,
      tracksToSave.map((i) => i.uri),
    );
  });

  test("should add new tracks to a playlist when append is set", async () => {
    // Arrange
    addTracksToPlaylist.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const playlist = userPlaylistsResponse.items[0];
    const saveAction: SaveAction = {
      operation: "action",
      type: "save",
      params: { uri: playlist.uri, append: true },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracksToSave: SpotifyApi.TrackObjectFull[] = compact(
      playlistTracksResponse.items.map((i) => i.track),
    );
    await runActionOperation(saveAction, tracksToSave);

    // Assert
    expect(getUserPlaylists).toHaveBeenCalledTimes(0);
    expect(createPlaylist).toHaveBeenCalledTimes(0);
    expect(replaceTracksInPlaylist).toHaveBeenCalledTimes(0);
    expect(reorderTracksInPlaylist).toHaveBeenCalledTimes(0);
    expect(addTracksToPlaylist).toHaveBeenCalledTimes(1);
    expect(addTracksToPlaylist).toHaveBeenCalledWith(
      playlist.id,
      tracksToSave.map((i) => i.uri),
    );
  });

  test("should update existing track order in a playlist when reorder is specified", async () => {
    // Arrange
    getPlaylistTracks.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });
    reorderTracksInPlaylist.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    const playlist = userPlaylistsResponse.items[0];
    const saveAction: SaveAction = {
      operation: "action",
      type: "save",
      params: { uri: playlist.uri, reorder: true },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracksToSave: SpotifyApi.TrackObjectFull[] = compact(
      playlistTracksResponse.items.map((i) => i.track),
    ).reverse();
    await runActionOperation(saveAction, tracksToSave);

    // Assert
    expect(getUserPlaylists).toHaveBeenCalledTimes(0);
    expect(createPlaylist).toHaveBeenCalledTimes(0);
    expect(replaceTracksInPlaylist).toHaveBeenCalledTimes(0);
    expect(addTracksToPlaylist).toHaveBeenCalledTimes(0);
    expect(getPlaylistTracks).toHaveBeenCalledTimes(1);
    expect(reorderTracksInPlaylist).toHaveBeenCalledTimes(tracksToSave.length - 1);
    expect(reorderTracksInPlaylist).toHaveBeenCalledWith(playlist.id, tracksToSave.length - 1, 0, {
      snapshot_id: "1",
    });
  });
});

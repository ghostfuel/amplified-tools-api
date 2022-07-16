import runWorkflowHandler from "./handler";
import { generateApiGatewayEvent } from "@common/test-utils";
import { lambdaResponse } from "@common/lambda";
import spotify from "@common/spotify-api";
import Workflow from "@custom/types/workflow";
import { PlaylistSource } from "@custom/types/workflow/sources";
import { SortBySorter } from "@custom/types/workflow/sorters";
import { SaveAction } from "@custom/types/workflow/actions";
import { playlistTracksResponse } from "@common/test-data";
import * as runSourceOperation from "@common/workflow/sources";
import * as runSelectorOperation from "@common/workflow/selectors";
import * as runSorterOperation from "@common/workflow/sorters";
import * as runFilterOperation from "@common/workflow/filters";
import * as runActionOperation from "@common/workflow/actions";
import { orderBy } from "lodash";

// Note: These tests will be larger than typical unit tests to perform tighter expectations on resultant data

describe("runWorkflow handler", () => {
  // Mock Spotify API Calls
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  // Sources
  const searchMock = jest.spyOn(spotify, "search");
  const getUserPlaylistsMock = jest.spyOn(spotify, "getUserPlaylists");
  const getPlaylistTracksMock = jest.spyOn(spotify, "getPlaylistTracks");
  // Sorters
  // Actions
  const createPlaylistMock = jest.spyOn(spotify, "createPlaylist");
  const changePlaylistDetailsMock = jest.spyOn(spotify, "changePlaylistDetails");
  const replaceTracksInPlaylistMock = jest.spyOn(spotify, "replaceTracksInPlaylist");
  const addTracksToPlaylistMock = jest.spyOn(spotify, "addTracksToPlaylist");
  const reorderTracksInPlaylistMock = jest.spyOn(spotify, "reorderTracksInPlaylist");

  // Operation Spies
  const runSourceOperationMock = jest.spyOn(runSourceOperation, "default");
  const runSelectorOperationMock = jest.spyOn(runSelectorOperation, "default");
  const runSorterOperationMock = jest.spyOn(runSorterOperation, "default");
  const runFilterOperationMock = jest.spyOn(runFilterOperation, "default");
  const runActionOperationMock = jest.spyOn(runActionOperation, "default");

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessTokenMock.mockReturnValue("test-token");

    changePlaylistDetailsMock.mockResolvedValue({
      body: "Playlist Updated",
      headers: {},
      statusCode: 200,
    });
  });

  test("run a simple [source, sorter, action] workflow", async () => {
    const playlistUri = "spotify:playlist:abcdef";

    // Arrange: Test event with minimum required parameters
    const testSourceOperation: PlaylistSource = {
      operation: "source",
      type: "playlist",
      params: { uri: playlistUri },
      inputs: [],
      outputs: [1],
      results: [],
    };

    const testSorterOperation: SortBySorter = {
      operation: "sorter",
      type: "sortBy",
      params: { property: "name", order: "asc" },
      inputs: [0],
      outputs: [2],
      results: [],
    };

    const testActionOperation: SaveAction = {
      operation: "action",
      type: "save",
      params: { uri: playlistUri, append: true },
      inputs: [1],
      outputs: [],
      results: [],
    };

    const testBody: Workflow = {
      operations: [testSourceOperation, testSorterOperation, testActionOperation],
      errors: [],
      results: [],
      spotifyTokens: {
        access_token: "test-token",
        refresh_token: "test-refresh-token",
        expires_in: 0,
        scope: "",
        token_type: "Bearer",
      },
    };

    const testWorkflowEvent = generateApiGatewayEvent({
      resource: "[source, sorter, action] workflow test",
      headers: { spotify: "test-token" },
      body: JSON.stringify(testBody),
    });

    // Arrange: Spotify API Mocks
    // Source
    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });
    // Sorter
    // Action
    addTracksToPlaylistMock.mockResolvedValue({
      body: { snapshot_id: "1" },
      headers: {},
      statusCode: 200,
    });

    // Act
    const response = await runWorkflowHandler(testWorkflowEvent);

    // Assert: Spotify API Mocks
    // Source
    expect(searchMock).toHaveBeenCalledTimes(0);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(0);
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(1);
    // Sorter
    // Action
    expect(createPlaylistMock).toHaveBeenCalledTimes(0);
    expect(replaceTracksInPlaylistMock).toHaveBeenCalledTimes(0);
    expect(reorderTracksInPlaylistMock).toHaveBeenCalledTimes(0);
    expect(addTracksToPlaylistMock).toHaveBeenCalledTimes(1);

    // Assert: Workflow Event
    expect(runSelectorOperationMock).toHaveBeenCalledTimes(0);
    expect(runFilterOperationMock).toHaveBeenCalledTimes(0);

    const expectedTracks = playlistTracksResponse.items
      .map((i) => i.track)
      .filter((t) => !t?.is_local);
    const expectedSortedTracks = orderBy(expectedTracks, "name");
    const expectedSourceState = { ...testSourceOperation, results: expectedTracks };
    expect(runSourceOperationMock).toHaveBeenCalledTimes(1);
    expect(runSourceOperationMock).toHaveBeenCalledWith(expectedSourceState);
    // TODO: expect(runSourceOperationMock).toHaveReturnedWith(expectedTracks);

    const expectedSorterState = { ...testSorterOperation, results: expectedSortedTracks };
    expect(runSorterOperationMock).toHaveBeenCalledTimes(1);
    expect(runSorterOperationMock).toHaveBeenCalledWith(expectedSorterState, expectedTracks);
    // TODO: expect(runSorterOperationMock).toHaveReturnedWith(expectedSortedTracks);

    const expectedActionState = { ...testActionOperation, results: expectedSortedTracks };
    expect(runActionOperationMock).toHaveBeenCalledTimes(1);
    expect(runActionOperationMock).toHaveBeenCalledWith(expectedActionState, expectedSortedTracks);
    // TODO: expect(runActionOperationMock).toHaveReturned();

    expect(response).toEqual(lambdaResponse(200, "Successfully completed workflow"));
  });
});

import logger from "@common/logger";
import spotify from "@common/spotify-api";
import {
  albumResponse,
  albumSearchResponse,
  artistSearchResponse,
  artistsTopTracksResponse,
  playlistTracksResponse,
  trackResponse,
  trackSearchResponse,
  tracksResponse,
} from "@common/test-data";
import { userPlaylistsResponse } from "@common/test-data/userPlaylistsResponse";
import SourceOperation, {
  AlbumSouceParams,
  ArtistSouceParams,
  PlaylistSourceParams,
  TrackSouceParams,
} from "@custom/types/workflow/sources";
import { sortBy } from "lodash";
import runSourceOperation, {
  getAlbumSource,
  getArtistSource,
  getPlaylistSource,
  getTrackSource,
} from "./sources";

describe("runSourceOperation", () => {
  test("should error when no access token has been set", async () => {
    const sourceOperation: SourceOperation = {
      operation: "source",
      type: "track",
      params: { uri: "spotify:track:abcdef" },
      inputs: [],
      outputs: [],
      results: [],
    };
    try {
      await runSourceOperation(sourceOperation);
    } catch (error) {
      expect(error.message).toEqual("Access Token has not been set.");
    }
  });

  test("should error when given an unknown operation", async () => {
    const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
    getAccessTokenMock.mockReturnValue("test-token");
    const unknownOperation = { type: "unknown" } as unknown as SourceOperation;
    try {
      await runSourceOperation(unknownOperation);
    } catch (error) {
      expect(error.message).toEqual(`Invalid Operation: ${unknownOperation.type}.`);
    }
  });
});

describe("getArtistSource", () => {
  // Mock logger
  const loggerErrorMock = jest.spyOn(logger, "error");

  // Mock Spotify API Calls
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  const getArtistTopTracksMock = jest.spyOn(spotify, "getArtistTopTracks");
  const searchMock = jest.spyOn(spotify, "search");

  beforeAll(() => {
    getAccessTokenMock.mockReturnValue("test-token");
  });

  test("should return artists top tracks when an id is provided", async () => {
    // Arrange: Mock required calls
    getArtistTopTracksMock.mockResolvedValueOnce({
      body: artistsTopTracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const artistSourceTracks = await getArtistSource({
      uri: "spotify:artist:abcdef",
      country: "GB",
    });

    // Assert
    expect(getArtistTopTracksMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(0);
    expect(artistSourceTracks.length).toEqual(artistsTopTracksResponse.tracks.length);
    expect(artistSourceTracks).toEqual(artistsTopTracksResponse.tracks);
  });

  test("should search and return artist top tracks when an id is not provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: artistSearchResponse,
      headers: {},
      statusCode: 200,
    });

    getArtistTopTracksMock.mockResolvedValueOnce({
      body: artistsTopTracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const artistSourceTracks = await getArtistSource({
      artist: "Beartooth",
      country: "GB",
    });

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(getArtistTopTracksMock).toHaveBeenCalledTimes(1);
    expect(artistSourceTracks.length).toEqual(artistsTopTracksResponse.tracks.length);
    expect(artistSourceTracks).toEqual(artistsTopTracksResponse.tracks);
  });

  test("should fail when no id was found or provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: { albums: { ...artistSearchResponse.artists, items: [] } },
      headers: {},
      statusCode: 200,
    });

    getArtistTopTracksMock.mockResolvedValueOnce({
      body: artistsTopTracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const params: ArtistSouceParams = { artist: "Beartooth", country: "GB" };
    const albumSourceTracks = await getArtistSource(params);

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(getArtistTopTracksMock).toHaveBeenCalledTimes(0);
    expect(loggerErrorMock).toHaveBeenCalledWith("Failed to find Artist", params);
    expect(albumSourceTracks).toEqual([]);
  });

  test("should error when no required parameters provided", async () => {
    try {
      await getArtistSource({});
    } catch (error) {
      expect(error.message).toEqual("Must provide a uri or artist and country.");
    }
  });
});

describe("getAlbumSource", () => {
  // Mock logger
  const loggerErrorMock = jest.spyOn(logger, "error");

  // Mock Spotify API Calls
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  const searchMock = jest.spyOn(spotify, "search");
  const getAlbumMock = jest.spyOn(spotify, "getAlbum");
  const getTracksMock = jest.spyOn(spotify, "getTracks");

  beforeAll(() => {
    getAccessTokenMock.mockReturnValue("test-token");
  });

  test("should return album tracks when an id is provided", async () => {
    // Arrange: Mock required calls
    getAlbumMock.mockResolvedValueOnce({
      body: albumResponse,
      headers: {},
      statusCode: 200,
    });

    getTracksMock.mockResolvedValueOnce({
      body: tracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const albumSourceTracks = await getAlbumSource({
      uri: albumResponse.uri,
    });

    // Assert
    expect(getAlbumMock).toHaveBeenCalledTimes(1);
    expect(getTracksMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(0);
    expect(albumSourceTracks.length).toEqual(albumResponse.tracks.items.length);
    expect(albumSourceTracks).toEqual(tracksResponse.tracks);
  });

  test("should search and return album tracks when an id is not provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: albumSearchResponse,
      headers: {},
      statusCode: 200,
    });

    getAlbumMock.mockResolvedValueOnce({
      body: albumResponse,
      headers: {},
      statusCode: 200,
    });

    getTracksMock.mockResolvedValueOnce({
      body: tracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const albumSourceTracks = await getAlbumSource({
      title: "Disease",
      artist: "Beartooth",
    });

    // Assert
    expect(getAlbumMock).toHaveBeenCalledTimes(1);
    expect(getTracksMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(1);
    // expect(albumSourceTracks.length).toEqual(albumResponse.tracks.items.length);
    expect(albumSourceTracks).toEqual(tracksResponse.tracks);
  });

  test("should fail when no id was found or provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: { albums: { ...albumSearchResponse.albums, items: [] } },
      headers: {},
      statusCode: 200,
    });

    getAlbumMock.mockResolvedValueOnce({
      body: albumResponse,
      headers: {},
      statusCode: 200,
    });

    getTracksMock.mockResolvedValueOnce({
      body: tracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const params: AlbumSouceParams = { title: "Disease", artist: "Beartooth" };
    const albumSourceTracks = await getAlbumSource(params);

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(getAlbumMock).toHaveBeenCalledTimes(0);
    expect(getTracksMock).toHaveBeenCalledTimes(0);
    expect(loggerErrorMock).toHaveBeenCalledWith("Failed to find Album", params);
    expect(albumSourceTracks).toEqual([]);
  });

  test("should error when no required parameters provided", async () => {
    try {
      await getAlbumSource({});
    } catch (error) {
      expect(error.message).toEqual("Must supply at least one of; uri, title");
    }

    expect(getAlbumMock).toHaveBeenCalledTimes(0);
    expect(getTracksMock).toHaveBeenCalledTimes(0);
    expect(searchMock).toHaveBeenCalledTimes(0);
  });
});

describe("getTrackSource", () => {
  // Mock logger
  const loggerErrorMock = jest.spyOn(logger, "error");

  // Mock Spotify API Calls
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  const searchMock = jest.spyOn(spotify, "search");
  const getTrackMock = jest.spyOn(spotify, "getTrack");

  beforeAll(() => {
    getAccessTokenMock.mockReturnValue("test-token");
  });

  test("should return a track when an id is provided", async () => {
    // Arrange: Mock required calls
    getTrackMock.mockResolvedValueOnce({
      body: trackResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const trackSourceTracks = await getTrackSource({
      uri: trackResponse.uri,
    });

    // Assert
    expect(getTrackMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(0);
    expect(trackSourceTracks.length).toEqual(1);
    expect(trackSourceTracks).toEqual([trackResponse]);
  });

  test("should search and return a track when an id is not provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: trackSearchResponse,
      headers: {},
      statusCode: 200,
    });

    getTrackMock.mockResolvedValueOnce({
      body: trackResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const trackSourceTracks = await getTrackSource({
      artist: "Beartooth",
      title: "Greatness or Death",
    });

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(getTrackMock).toHaveBeenCalledTimes(0);
    expect(trackSourceTracks.length).toEqual(1);
    expect(trackSourceTracks).toEqual([trackResponse]);
  });

  test("should fail when no id was found or provided", async () => {
    // Arrange: Mock required calls
    searchMock.mockResolvedValueOnce({
      body: { albums: { ...trackSearchResponse.tracks, items: [] } },
      headers: {},
      statusCode: 200,
    });

    getTrackMock.mockResolvedValueOnce({
      body: trackResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const params: TrackSouceParams = {
      artist: "Beartooth",
      title: "Greatness or Death",
    };
    const trackSourceTracks = await getTrackSource(params);

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(getTrackMock).toHaveBeenCalledTimes(0);
    expect(loggerErrorMock).toHaveBeenCalledWith("Failed to find Track", params);
    expect(trackSourceTracks).toEqual([]);
  });

  test("should error when no required parameters provided", async () => {
    try {
      await getTrackSource({});
    } catch (error) {
      expect(error.message).toEqual("Must supply at least one of; uri, title");
    }

    expect(getTrackMock).toHaveBeenCalledTimes(0);
    expect(searchMock).toHaveBeenCalledTimes(0);
  });
});

describe("getPlaylistSource", () => {
  // Mock logger
  const loggerErrorMock = jest.spyOn(logger, "error");

  // Mock Spotify API Calls
  const getAccessTokenMock = jest.spyOn(spotify, "getAccessToken");
  const searchMock = jest.spyOn(spotify, "search");
  const getUserPlaylistsMock = jest.spyOn(spotify, "getUserPlaylists");
  const getPlaylistTracksMock = jest.spyOn(spotify, "getPlaylistTracks");

  beforeAll(() => {
    getAccessTokenMock.mockReturnValue("test-token");
  });

  // eslint-disable-next-line jest/no-focused-tests
  test("should return playlist tracks when an id is provided", async () => {
    // Arrange: Mock required calls
    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    getUserPlaylistsMock.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const playlistSourceTracks = await getPlaylistSource({
      uri: "spotify:playlist:abcdef",
    });

    // Assert
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(1);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(0);
    expect(searchMock).toHaveBeenCalledTimes(0);
    // Normalise to TrackObjectFull[] and remove local tracks by default
    const nonLocalTracks = playlistTracksResponse.items.filter((track) => !track.is_local);
    const localTracks = playlistTracksResponse.items.filter((track) => track.is_local);
    const tracks = nonLocalTracks.map((i) => i.track);
    expect(playlistSourceTracks.length).toEqual(nonLocalTracks.length);
    expect(playlistSourceTracks).toEqual(tracks);
    expect(localTracks.length).toEqual(1);
  });

  // eslint-disable-next-line jest/no-focused-tests
  test("should search and return playlist tracks when an id is not provided", async () => {
    // Arrange: Mock required calls
    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    getUserPlaylistsMock.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const playlistSourceTracks = await getPlaylistSource({
      name: "Starred",
    });

    // Assert
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(1);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(0);
    // Normalise to TrackObjectFull[] and remove local tracks by default
    const nonLocalTracks = playlistTracksResponse.items.filter((track) => !track.is_local);
    const localTracks = playlistTracksResponse.items.filter((track) => track.is_local);
    const tracks = nonLocalTracks.map((i) => i.track);
    expect(playlistSourceTracks.length).toEqual(nonLocalTracks.length);
    expect(playlistSourceTracks).toEqual(tracks);
    expect(localTracks.length).toEqual(1);
  });

  test("should return playlist tracks with replaced local tracks", async () => {
    // Arrange: Mock required calls
    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    getUserPlaylistsMock.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    searchMock.mockResolvedValue({
      body: trackSearchResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const playlistSourceTracks = await getPlaylistSource({
      name: "Starred",
      handleLocalTracks: "replace",
    });

    // Assert
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(1);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(1);
    // Normalise to TrackObjectFull[] and check no local tracks remain
    const nonLocalTracks = playlistTracksResponse.items.filter((track) => !track.is_local);
    const localTracks = playlistTracksResponse.items.filter((track) => track.is_local);
    const tracks = nonLocalTracks.map((i) => i.track);
    expect(playlistSourceTracks.length).toEqual(nonLocalTracks.length);
    expect(playlistSourceTracks).toEqual(tracks);
    expect(localTracks.length).toEqual(0);
  });

  test("should return playlist tracks in date added order", async () => {
    // Arrange: Mock required calls
    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    getUserPlaylistsMock.mockResolvedValue({
      body: userPlaylistsResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const playlistSourceTracks = await getPlaylistSource({
      name: "Starred",
      orderByDateAdded: "asc",
    });

    // Assert
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(1);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledTimes(0);
    // Normalise to TrackObjectFull[] and check no local tracks remain
    const expectedOrderTracks = sortBy(playlistTracksResponse.items, "added_at");
    const nonLocalTracks = expectedOrderTracks.filter((track) => !track.is_local);
    const localTracks = expectedOrderTracks.filter((track) => track.is_local);
    const tracks = nonLocalTracks.map((i) => i.track);
    expect(playlistSourceTracks.length).toEqual(nonLocalTracks.length);
    expect(playlistSourceTracks).toEqual(tracks);
    expect(localTracks.length).toEqual(0);
  });

  test("should fail when no id was found or provided", async () => {
    // Arrange: Mock required calls
    getUserPlaylistsMock.mockResolvedValue({
      body: { ...userPlaylistsResponse, items: [] },
      headers: {},
      statusCode: 200,
    });

    getPlaylistTracksMock.mockResolvedValue({
      body: playlistTracksResponse,
      headers: {},
      statusCode: 200,
    });

    // Act
    const params: PlaylistSourceParams = { name: "Starred" };
    const playlistSourceTracks = await getPlaylistSource(params);

    // Assert
    expect(searchMock).toHaveBeenCalledTimes(0);
    expect(getUserPlaylistsMock).toHaveBeenCalledTimes(1);
    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(0);
    expect(loggerErrorMock).toHaveBeenCalledWith("Failed to find Playlist", params);
    expect(playlistSourceTracks).toEqual([]);
  });

  test("should error when no required parameters provided", async () => {
    try {
      await getTrackSource({});
    } catch (error) {
      expect(error.message).toEqual("Must supply at least one of; uri, title");
    }

    expect(getPlaylistTracksMock).toHaveBeenCalledTimes(0);
    expect(searchMock).toHaveBeenCalledTimes(0);
  });
});

import { tracksResponse } from "@common/test-data";
import SelectorOperation, {
  AlternateSelector,
  ConcatenateSelector,
  LimitSelector,
  RandomSelector,
} from "@custom/types/workflow/selectors";
import { compact, uniqBy, zip } from "lodash";
import runSelectorOperation from "./selectors";

describe("runSelectorOperation", () => {
  test("should error when given an unknown operation", async () => {
    const unknownOperation = { type: "unknown" } as unknown as SelectorOperation;
    try {
      await runSelectorOperation(unknownOperation, []);
    } catch (error) {
      expect(error.message).toEqual(`Invalid Operation: ${unknownOperation.type}.`);
    }
  });
});

describe("runAlternateSelector", () => {
  test("should return alternated tracks from two sources of equal length up to a limit", async () => {
    // Arrange
    const alternateSelector: AlternateSelector = {
      operation: "selector",
      type: "alternate",
      params: { limit: 6 },
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 5);
    const source2 = tracksResponse.tracks.slice(5, 10);
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2];

    // Act
    const tracks = await runSelectorOperation(alternateSelector, sources);

    // Assert
    expect(tracks.length).toEqual(alternateSelector.params.limit);
    tracks.forEach((track, index) => {
      if (index & 1) {
        expect(track).toEqual(source2.shift()); // Odd
      } else {
        expect(track).toEqual(source1.shift()); // Even
      }
    });
  });

  test("should return alternated tracks from three sources of different length", async () => {
    // Arrange
    const alternateSelector: AlternateSelector = {
      operation: "selector",
      type: "alternate",
      params: {},
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 3);
    const source2 = tracksResponse.tracks.slice(3, 5);
    const source3 = tracksResponse.tracks.slice(5, 10);
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2, source3];

    // Act
    const tracks = await runSelectorOperation(alternateSelector, sources);

    // Assert
    expect(tracks.length).toEqual(source1.length + source2.length + source3.length);
    const expectedTracks = compact(zip(...sources).flat());
    expect(tracks).toEqual(expectedTracks);
  });
});

describe("runConcatenateSelector", () => {
  test("should return combined tracks from two sources of equal length up to a limit", async () => {
    // Arrange
    const concatenateSelector: ConcatenateSelector = {
      operation: "selector",
      type: "concatenate",
      params: { limit: 7 },
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 5);
    const source2 = tracksResponse.tracks.slice(5, 10);
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2];

    // Act
    const tracks = await runSelectorOperation(concatenateSelector, sources);

    // Assert
    expect(tracks.length).toEqual(concatenateSelector.params.limit);
    const expectedTracks = sources.flat().slice(0, concatenateSelector.params.limit);
    expect(tracks).toEqual(expectedTracks);
  });

  test("should return combined tracks from deduping two sources", async () => {
    // Arrange
    const concatenateSelector: ConcatenateSelector = {
      operation: "selector",
      type: "concatenate",
      params: { dedupe: true },
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 5);
    const source2 = tracksResponse.tracks.slice(5, 10);
    source2[0] = source1[0]; // Duplicate track
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2];

    // Act
    const tracks = await runSelectorOperation(concatenateSelector, sources);

    // Assert
    const expectedTracks = uniqBy(sources.flat(), "id");
    expect(tracks.length).toEqual(expectedTracks.length);
    expect(tracks).toEqual(expectedTracks);
  });
});

describe("runRandomSelector", () => {
  test("should return a random order of tracks from two sources of equal length", async () => {
    // Arrange
    const randomSelector: RandomSelector = {
      operation: "selector",
      type: "random",
      params: {},
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 5);
    const source2 = tracksResponse.tracks.slice(5, 10);
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2];

    // Act
    const tracks = await runSelectorOperation(randomSelector, sources);

    // Assert
    expect(tracks.length).toEqual(sources.flat().length);
    expect(tracks).not.toEqual(sources.flat());
  });
});

describe("runLimitSelector", () => {
  test("should return a limited number of tracks from two sources of equal length", async () => {
    // Arrange
    const limitSelector: LimitSelector = {
      operation: "selector",
      type: "limit",
      params: {
        limit: 3,
      },
      inputs: [],
      outputs: [],
      results: [],
    };

    const source1 = tracksResponse.tracks.slice(0, 5);
    const source2 = tracksResponse.tracks.slice(5, 10);
    const sources: SpotifyApi.TrackObjectFull[][] = [source1, source2];

    // Act
    const tracks = await runSelectorOperation(limitSelector, sources);

    // Assert
    expect(tracks.length).toEqual(limitSelector.params.limit);
    expect(tracks).toEqual(sources.flat().slice(0, 3));
  });
});

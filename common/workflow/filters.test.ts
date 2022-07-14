import { tracksResponse } from "@common/test-data";
import FilterOperation, {
  DateFilter,
  DedupeFilter,
  RemoveFilter,
} from "@custom/types/workflow/filters";
import runFilterOperation from "./filters";

describe("runFilterOperation", () => {
  test("should error when given an unknown operation", async () => {
    const unknownOperation = { type: "unknown" } as unknown as FilterOperation;
    try {
      await runFilterOperation(unknownOperation, []);
    } catch (error) {
      expect(error.message).toEqual(`Invalid Operation: ${unknownOperation.type}.`);
    }
  });
});

describe("runDedupeFilter", () => {
  test("should return tracks deduped by artist", async () => {
    // Arrange
    const dedupeFilter: DedupeFilter = {
      operation: "filter",
      type: "dedupe",
      params: { filter: "artist" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(dedupeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(1);
    expect(tracks).toEqual([tracksResponse.tracks[0]]);
  });

  test("should return tracks deduped by album", async () => {
    // Arrange
    const dedupeFilter: DedupeFilter = {
      operation: "filter",
      type: "dedupe",
      params: { filter: "album" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(dedupeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(1);
    expect(tracks).toEqual([tracksResponse.tracks[0]]);
  });

  test("should return tracks deduped by track", async () => {
    // Arrange
    const dedupeFilter: DedupeFilter = {
      operation: "filter",
      type: "dedupe",
      params: { filter: "track" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(dedupeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    expect(tracks).toEqual(tracksResponse.tracks);
  });
});

describe("runRemoveFilter", () => {
  test("should return tracks where all tracks by an artist have been removed", async () => {
    // Arrange
    const removeFilter: RemoveFilter = {
      operation: "filter",
      type: "remove",
      params: { filter: "artist", name: "Beartooth" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(removeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(0);
    expect(tracks).toEqual([]);
  });

  test("should return tracks where all tracks from an album have been removed", async () => {
    // Arrange
    const removeFilter: RemoveFilter = {
      operation: "filter",
      type: "remove",
      params: { filter: "album", name: "Disease" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(removeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(0);
    expect(tracks).toEqual([]);
  });

  test("should return tracks where all track names containing a string have been removed", async () => {
    // Arrange
    const removeFilter: RemoveFilter = {
      operation: "filter",
      type: "remove",
      params: { filter: "track", name: "Greatness" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(removeFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length - 1);
    expect(tracks).toEqual(tracksResponse.tracks.slice(1));
  });
});

describe("runDateFilter", () => {
  test("should return tracks where all tracks newer than now have been removed", async () => {
    // Arrange
    const dateFilter: DateFilter = {
      operation: "filter",
      type: "date",
      params: { newerThan: new Date().toISOString() },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(dateFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(0);
    expect(tracks).toEqual([]);
  });

  test("should return tracks where all tracks older than now have been removed", async () => {
    // Arrange
    const dateFilter: DateFilter = {
      operation: "filter",
      type: "date",
      params: { olderThan: new Date().toISOString() },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runFilterOperation(dateFilter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    expect(tracks).toEqual(tracksResponse.tracks);
  });
});

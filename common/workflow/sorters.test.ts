import { tracksResponse } from "@common/test-data";
import {
  ReverseSorter,
  ShuffleSorter,
  SortBySorter,
  SorterOperation,
} from "@custom/types/workflow/sorters";
import { sortBy } from "lodash";
import runSorterOperation from "./sorters";

describe("runSorterOperation", () => {
  test("should error when given an unknown operation", async () => {
    const unknownOperation = { type: "unknown" } as unknown as SorterOperation;
    try {
      await runSorterOperation(unknownOperation, []);
    } catch (error) {
      expect(error.message).toEqual(`Invalid Operation: ${unknownOperation.type}.`);
    }
  });
});

describe("runSortBySorter", () => {
  test("should return tracks sorted by artist name in descending order", async () => {
    // Arrange
    const sortBySorter: SortBySorter = {
      operation: "sorter",
      type: "sortBy",
      params: { property: "artists", order: "desc" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runSorterOperation(sortBySorter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    // TODO: Need to do more complex testing here and also test util sortArtists function
    expect(tracks).not.toEqual(tracksResponse);
  });

  test("should return tracks sorted by track name in ascending order", async () => {
    // Arrange
    const sortBySorter: SortBySorter = {
      operation: "sorter",
      type: "sortBy",
      params: { property: "name", order: "asc" },
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runSorterOperation(sortBySorter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    const expectedTracks = sortBy(tracksResponse.tracks, "name");
    expect(tracks).toEqual(expectedTracks);
  });
});

describe("runReverseSorter", () => {
  test("should return tracks in reverse order", async () => {
    // Arrange
    const reverseSorter: ReverseSorter = {
      operation: "sorter",
      type: "reverse",
      params: undefined,
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runSorterOperation(reverseSorter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    expect(tracks).toEqual(tracksResponse.tracks.reverse());
  });
});

describe("runShuffleSorter", () => {
  test("should return tracks in a shuffled order", async () => {
    // Arrange
    const shuffleSorter: ShuffleSorter = {
      operation: "sorter",
      type: "shuffle",
      params: undefined,
      inputs: [],
      outputs: [],
      results: [],
    };

    // Act
    const tracks = await runSorterOperation(shuffleSorter, tracksResponse.tracks);

    // Assert
    expect(tracks.length).toEqual(tracksResponse.tracks.length);
    expect(tracks).not.toEqual(tracksResponse.tracks);
  });
});

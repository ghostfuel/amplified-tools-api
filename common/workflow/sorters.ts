import { shuffle, sortTracksByArtists } from "@common/utils";
import { UnknownOperation } from "@custom/types/workflow";
import { SortBySorter, SorterOperation } from "@custom/types/workflow/sorters";
import { get, orderBy } from "lodash";

export default async function (operation: SorterOperation, tracks: SpotifyApi.TrackObjectFull[]) {
  switch (operation.type) {
    case "sortBy":
      const sortBySorter = operation as SortBySorter;
      const { property, order } = sortBySorter.params;
      return runSortBySorter(tracks, property, order);
    case "reverse":
      return runReverseSorter(tracks);
    case "shuffle":
      return runShuffleSorter(tracks);
    // case "seperated":
    //   const seperatedSorter = operation as SeperatedSorter;
    //   return runSeperatedSorter(tracks, seperatedSorter.params.seperator);
    default:
      const unknownOperation = operation as UnknownOperation;
      throw new Error(`Invalid Operation: ${unknownOperation.type}.`);
  }
}

export function runSortBySorter(
  tracks: SpotifyApi.TrackObjectFull[],
  property?: string,
  order: "asc" | "desc" = "desc",
) {
  let output = tracks;

  // Sort according to supplied property and order
  if (property) {
    const options = {
      propertyPath: property,
      removeArticles: true,
      ignoreWhitespace: true,
      extendedFields: ["album.name", "name"],
    };

    // Handle complex sorting of artists or string properties in lowercase
    output = property.includes("artists")
      ? sortTracksByArtists(tracks, options)
      : orderBy(tracks, [(track) => get(track, property).toLowerCase()]);
  }

  // Reverse order if specified
  if (order === "desc") {
    output.reverse();
  }

  return output;
}

export function runReverseSorter(tracks: SpotifyApi.TrackObjectFull[]) {
  return tracks.reverse();
}

export function runShuffleSorter(tracks: SpotifyApi.TrackObjectFull[]) {
  return shuffle(tracks);
}

// TODO:
// export function runSeperatedSorter(
//   tracks: SpotifyApi.TrackObjectFull[],
//   seperator?: "artist" | "album",
// ) {
//   return tracks;
// }

import { uniqBy } from "lodash";
import {
  DateFilter,
  DateFilterParams,
  DedupeFilter,
  DedupeFilterParams,
  FilterOperation,
  RemoveFilter,
  RemoveFilterParams,
} from "@custom/types/workflow/filters";
import { UnknownOperation } from "@custom/types/workflow";

export default async function (operation: FilterOperation, tracks: SpotifyApi.TrackObjectFull[]) {
  switch (operation.type) {
    case "dedupe":
      const dedupeFilter = operation as DedupeFilter;
      return runDedupeFilter(tracks, dedupeFilter.params);
    case "remove":
      const removeFilter = operation as RemoveFilter;
      return runRemoveFilter(tracks, removeFilter.params);
    // case "audio-feature":
    //   const audioFeatureFilter = operation as AudioFeatureFilter;
    //   return runAudioFeatureFilter(tracks, audioFeatureFilter.params);
    case "date":
      const dateFilter = operation as DateFilter;
      return runDateFilter(tracks, dateFilter.params);
    default:
      const unknownOperation = operation as UnknownOperation;
      throw new Error(`Invalid Operation: ${unknownOperation.type}.`);
  }
}

// TODO: This could be done a lot better (also, iteratee/shorthand properties are not supported)
export function runDedupeFilter(tracks: SpotifyApi.TrackObjectFull[], params: DedupeFilterParams) {
  const { filter } = params;
  let deduped = tracks;

  // Dedupe Albums by property/name
  if (filter === "album" || filter === "any") deduped = uniqBy(deduped, (a) => a.album?.id);
  // TODO: Improve dedupe to all artists/join artists
  // Dedupe Artists by property/name
  if (filter === "artist" || filter === "any") deduped = uniqBy(deduped, (a) => a.artists[0]?.id);
  // Dedupe Tracks by property/name
  if (filter === "track" || filter === "any") deduped = uniqBy(deduped, (a) => a?.id);

  return deduped;
}

export function runRemoveFilter(tracks: SpotifyApi.TrackObjectFull[], params: RemoveFilterParams) {
  const { filter, name } = params;

  if (!name) {
    throw Error("Must provide name param for a Remove Filter");
  }

  // Remove by property/name
  const removed = tracks.filter((track) => {
    if (filter === "album") return !track.album.name.includes(name);
    if (filter === "artist") return !track.artists.some((artist) => artist.name.includes(name));
    if (filter === "track") return !track.name.includes(name);
    return false;
  });

  return removed;
}

// TODO:
// export function runAudioFeatureFilter(
//   tracks: SpotifyApi.TrackObjectFull[],
//   params: AudioFeatureFilterParams,
// ) {
//   return tracks;
// }

// TODO: add negation
export function runDateFilter(tracks: SpotifyApi.TrackObjectFull[], params: DateFilterParams) {
  const { newerThan, olderThan } = params;

  if (!newerThan && !olderThan) {
    throw Error("Must provide at least one of; newerThan, olderThan");
  }

  let newerThanDate = new Date(-1); // Min Date
  let olderThanDate = new Date(8640000000000000); // Max Date

  if (newerThan) newerThanDate = new Date(newerThan);
  if (olderThan) olderThanDate = new Date(olderThan);

  // Remove/Keep Album.release_date <> dateTo/From
  const filtered = tracks.filter((track) => {
    const date = new Date(track.album.release_date);
    return date >= newerThanDate && date <= olderThanDate;
  });

  return filtered;
}

import { uniqBy } from "lodash";
import { SelectorOperation } from "@custom/types/workflow/selectors";
import { UnknownOperation } from "@custom/types/workflow";

// TODO: remove Limit: Infinity and swap to deep fetch
export default async function (
  operation: SelectorOperation,
  sources: SpotifyApi.TrackObjectFull[][],
) {
  const dedupe = operation.params?.dedupe;
  const limit = operation.params?.limit;

  switch (operation.type) {
    case "alternate":
      return runAlternateSelector(sources, dedupe, limit);
    case "concatenate":
      return runConcatenateSelector(sources, dedupe, limit);
    // TODO: MixSelector
    // case "mix":
    //   return runMixSelector(sources, dedupe, limit);
    case "random":
      return runRandomSelector(sources, dedupe, limit);
    case "limit":
      return runLimitSelector(sources, dedupe, limit);
    default:
      const unknownOperation = operation as UnknownOperation;
      throw new Error(`Invalid Operation: ${unknownOperation.type}.`);
  }
}

// Alternate
export function runAlternateSelector(
  sources: SpotifyApi.TrackObjectFull[][],
  dedupe = false,
  limit = Infinity,
): SpotifyApi.TrackObjectFull[] {
  // For Each Track Array, select n
  const output: SpotifyApi.TrackObjectFull[] = [];

  // Store longest source
  let maxLength = 0;
  sources.forEach((tracks) => {
    maxLength = tracks.length > maxLength ? tracks.length : maxLength;
  });

  // Loop over all
  for (let i = 0; i < maxLength; i++) {
    // Check for Limit
    if (output.length >= limit) break;
    // Add more per source
    sources.forEach((tracks) => {
      // Simple Dedupe, although this is not a true 'alternate' TODO: Do Dedupe first.
      const skip = dedupe && output.some((track) => track.id === tracks[i]?.id);
      if (tracks[i] || skip) output.push(tracks[i]);
    });
  }

  return output;
}

// Concatenate
export function runConcatenateSelector(
  sources: SpotifyApi.TrackObjectFull[][],
  dedupe = false,
  limit = Infinity,
): SpotifyApi.TrackObjectFull[] {
  let output = sources.flat();

  if (limit) {
    output = output.slice(0, limit);
  }

  if (dedupe) {
    output = uniqBy(output, (a) => a.id);
  }

  return output;
}

// TODO: Mix

// Random
export function runRandomSelector(
  sources: SpotifyApi.TrackObjectFull[][],
  dedupe = false,
  limit = Infinity,
): SpotifyApi.TrackObjectFull[] {
  let output: SpotifyApi.TrackObjectFull[] = [];

  for (let i = 0; i < sources.flat().length; i++) {
    // Check for Limit
    if (output.length >= limit) break;

    // Find a random source and take its top track.
    const random = Math.floor(Math.random() * sources.length);
    const randomSource = sources[random];
    const track = randomSource.shift();

    // Store track or remove source when empty.
    if (!track) {
      sources.splice(random, 1);
      // On the final source, just add all tracks.
      if (sources.length === 1) output = output.concat(sources[0]);
    } else if (!(dedupe && output.some((a) => a.id === track?.id))) {
      output.push(track);
    }
  }

  return output;
}

// Limit
export function runLimitSelector(
  sources: SpotifyApi.TrackObjectFull[][],
  dedupe = false,
  limit = Infinity,
): SpotifyApi.TrackObjectFull[] {
  let output = sources.flat();

  if (limit) {
    output = output.slice(0, limit);
  }

  if (dedupe) {
    output = uniqBy(output, (a) => a.id);
  }

  return output;
}

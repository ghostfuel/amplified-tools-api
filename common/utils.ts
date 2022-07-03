import { get, set } from "lodash";
import fetch from "node-fetch";
import spotify from "./spotify-api";

function removeArticle(string: string) {
  return string.toLowerCase().replace(/^(an?|the)\s/i, "");
}

// Sort Artists
export function sortArtists(collection: SpotifyApi.PlaylistTrackObject[], seed?: object) {
  const options = {
    propertyPath: "track.artists",
    removeArticles: true,
    ignoreWhitespace: true,
    extendedFields: ["track.album.name", "track.name"],
    ...seed,
  };

  // Deep Clone...
  const clone = JSON.parse(JSON.stringify(collection)) as SpotifyApi.PlaylistTrackObject[];
  clone.sort((a: SpotifyApi.PlaylistTrackObject, b: SpotifyApi.PlaylistTrackObject) => {
    const artistsA = get(a, options.propertyPath);
    const artistsB = get(b, options.propertyPath);

    const artistA = artistsA
      .map((artist: SpotifyApi.ArtistObjectFull) => {
        let name = artist.name;
        name = options.removeArticles ? removeArticle(name) : name;
        return options.ignoreWhitespace ? name.replace(/\s/g, "") : name;
      })
      .join(" ");

    const artistB = artistsB
      .map((artist: SpotifyApi.ArtistObjectFull) => {
        let name = artist.name;
        name = options.removeArticles ? removeArticle(name) : name;
        return options.ignoreWhitespace ? name.replace(/\s/g, "") : name;
      })
      .join(" ");

    if (artistA < artistB) return -1;
    if (artistA > artistB) return 1;

    // Where Artists are the same, sort by extended fields
    for (const extendedField of options.extendedFields) {
      let extendedA = get(a, extendedField);
      let extendedB = get(b, extendedField);

      extendedA = options.removeArticles ? removeArticle(extendedA) : extendedA;
      extendedA = options.ignoreWhitespace ? extendedA.replace(/\s/g, "") : extendedA;
      extendedB = options.removeArticles ? removeArticle(extendedB) : extendedB;
      extendedB = options.ignoreWhitespace ? extendedB.replace(/\s/g, "") : extendedB;

      if (extendedA < extendedB) return -1;
      if (extendedA > extendedB) return 1;
    }

    // Preserve Order
    return 0;
  });

  return clone;
}

interface ApiResponse<T> {
  body: T;
  headers: Record<string, string>;
  statusCode: number;
}

export async function getAllPagedRequest<T>(
  endpoint: any,
  path = "items",
): Promise<ApiResponse<T>> {
  const response = await endpoint;
  let items: any[] = get(response.body, path);

  while (response.body.next) {
    const request = await fetch(response.body.next, {
      headers: { authorization: `Bearer ${spotify.getAccessToken()}` },
    });

    response.body = await request.json();
    response.statusCode = request.status;
    items = items.concat(get(response.body, path));
  }

  response.body = set(response.body, path, items);
  return response;
}

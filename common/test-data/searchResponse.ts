export const trackSearchResponse: SpotifyApi.TrackSearchResponse = {
  tracks: {
    href: "https://api.spotify.com/v1/search?query=track%3AGreatness+or+Death+artist%3ABeartooth&type=track&locale=en-GB%2Cen-US%3Bq%3D0.9%2Cen%3Bq%3D0.8%2Cfr%3Bq%3D0.7&offset=0&limit=1",
    items: [
      {
        album: {
          album_type: "album",
          artists: [
            {
              external_urls: {
                spotify: "https://open.spotify.com/artist/6vwjIs0tbIiseJMR3pqwiL",
              },
              href: "https://api.spotify.com/v1/artists/6vwjIs0tbIiseJMR3pqwiL",
              id: "6vwjIs0tbIiseJMR3pqwiL",
              name: "Beartooth",
              type: "artist",
              uri: "spotify:artist:6vwjIs0tbIiseJMR3pqwiL",
            },
          ],
          available_markets: [],
          external_urls: {
            spotify: "https://open.spotify.com/album/1EFr8cW4waL1ASHS1RdmhF",
          },
          href: "https://api.spotify.com/v1/albums/1EFr8cW4waL1ASHS1RdmhF",
          id: "1EFr8cW4waL1ASHS1RdmhF",
          images: [
            {
              height: 640,
              url: "https://i.scdn.co/image/ab67616d0000b273a898bedf301bdc19d6d39042",
              width: 640,
            },
            {
              height: 300,
              url: "https://i.scdn.co/image/ab67616d00001e02a898bedf301bdc19d6d39042",
              width: 300,
            },
            {
              height: 64,
              url: "https://i.scdn.co/image/ab67616d00004851a898bedf301bdc19d6d39042",
              width: 64,
            },
          ],
          name: "Disease",
          release_date: "2018-09-28",
          release_date_precision: "day",
          total_tracks: 12,
          type: "album",
          uri: "spotify:album:1EFr8cW4waL1ASHS1RdmhF",
        },
        artists: [
          {
            external_urls: {
              spotify: "https://open.spotify.com/artist/6vwjIs0tbIiseJMR3pqwiL",
            },
            href: "https://api.spotify.com/v1/artists/6vwjIs0tbIiseJMR3pqwiL",
            id: "6vwjIs0tbIiseJMR3pqwiL",
            name: "Beartooth",
            type: "artist",
            uri: "spotify:artist:6vwjIs0tbIiseJMR3pqwiL",
          },
        ],
        available_markets: [],
        disc_number: 1,
        duration_ms: 202377,
        explicit: false,
        external_ids: {
          isrc: "USP6L1800288",
        },
        external_urls: {
          spotify: "https://open.spotify.com/track/3hEjMuyL8KuZUHKOjX5Wf0",
        },
        href: "https://api.spotify.com/v1/tracks/3hEjMuyL8KuZUHKOjX5Wf0",
        id: "3hEjMuyL8KuZUHKOjX5Wf0",
        is_local: false,
        name: "Greatness or Death",
        popularity: 41,
        preview_url:
          "https://p.scdn.co/mp3-preview/53bd8c2494323805f665b9cd7cd2122b1835587e?cid=774b29d4f13844c495f206cafdad9c86",
        track_number: 1,
        type: "track",
        uri: "spotify:track:3hEjMuyL8KuZUHKOjX5Wf0",
      },
    ],
    limit: 1,
    next: "https://api.spotify.com/v1/search?query=track%3AGreatness+or+Death+artist%3ABeartooth&type=track&locale=en-GB%2Cen-US%3Bq%3D0.9%2Cen%3Bq%3D0.8%2Cfr%3Bq%3D0.7&offset=1&limit=1",
    offset: 0,
    previous: null,
    total: 2,
  },
};

export const albumSearchResponse: SpotifyApi.AlbumSearchResponse = {
  albums: {
    href: "https://api.spotify.com/v1/search?query=album%3ADisease+artist%3ABeartooth&type=album&locale=en-GB%2Cen-US%3Bq%3D0.9%2Cen%3Bq%3D0.8%2Cfr%3Bq%3D0.7&offset=0&limit=20",
    items: [
      {
        album_type: "album",
        artists: [
          {
            external_urls: {
              spotify: "https://open.spotify.com/artist/6vwjIs0tbIiseJMR3pqwiL",
            },
            href: "https://api.spotify.com/v1/artists/6vwjIs0tbIiseJMR3pqwiL",
            id: "6vwjIs0tbIiseJMR3pqwiL",
            name: "Beartooth",
            type: "artist",
            uri: "spotify:artist:6vwjIs0tbIiseJMR3pqwiL",
          },
        ],
        available_markets: [],
        external_urls: {
          spotify: "https://open.spotify.com/album/1EFr8cW4waL1ASHS1RdmhF",
        },
        href: "https://api.spotify.com/v1/albums/1EFr8cW4waL1ASHS1RdmhF",
        id: "1EFr8cW4waL1ASHS1RdmhF",
        images: [
          {
            height: 640,
            url: "https://i.scdn.co/image/ab67616d0000b273a898bedf301bdc19d6d39042",
            width: 640,
          },
          {
            height: 300,
            url: "https://i.scdn.co/image/ab67616d00001e02a898bedf301bdc19d6d39042",
            width: 300,
          },
          {
            height: 64,
            url: "https://i.scdn.co/image/ab67616d00004851a898bedf301bdc19d6d39042",
            width: 64,
          },
        ],
        name: "Disease",
        release_date: "2018-09-28",
        release_date_precision: "day",
        total_tracks: 12,
        type: "album",
        uri: "spotify:album:1EFr8cW4waL1ASHS1RdmhF",
      },
      {
        album_type: "album",
        artists: [
          {
            external_urls: {
              spotify: "https://open.spotify.com/artist/6vwjIs0tbIiseJMR3pqwiL",
            },
            href: "https://api.spotify.com/v1/artists/6vwjIs0tbIiseJMR3pqwiL",
            id: "6vwjIs0tbIiseJMR3pqwiL",
            name: "Beartooth",
            type: "artist",
            uri: "spotify:artist:6vwjIs0tbIiseJMR3pqwiL",
          },
        ],
        available_markets: [],
        external_urls: {
          spotify: "https://open.spotify.com/album/0W1v4PxSlD1gMIbUlejqr8",
        },
        href: "https://api.spotify.com/v1/albums/0W1v4PxSlD1gMIbUlejqr8",
        id: "0W1v4PxSlD1gMIbUlejqr8",
        images: [
          {
            height: 640,
            url: "https://i.scdn.co/image/ab67616d0000b27365cf0fe218482e6364f08380",
            width: 640,
          },
          {
            height: 300,
            url: "https://i.scdn.co/image/ab67616d00001e0265cf0fe218482e6364f08380",
            width: 300,
          },
          {
            height: 64,
            url: "https://i.scdn.co/image/ab67616d0000485165cf0fe218482e6364f08380",
            width: 64,
          },
        ],
        name: "Disease (Deluxe Edition)",
        release_date: "2019-10-25",
        release_date_precision: "day",
        total_tracks: 18,
        type: "album",
        uri: "spotify:album:0W1v4PxSlD1gMIbUlejqr8",
      },
    ],
    limit: 20,
    next: null,
    offset: 0,
    previous: null,
    total: 2,
  },
};

export const artistSearchResponse: SpotifyApi.ArtistSearchResponse = {
  artists: {
    href: "https://api.spotify.com/v1/search?query=artist%3ABeartooth&type=artist&locale=en-GB%2Cen-US%3Bq%3D0.9%2Cen%3Bq%3D0.8%2Cfr%3Bq%3D0.7&offset=0&limit=20",
    items: [
      {
        external_urls: {
          spotify: "https://open.spotify.com/artist/6vwjIs0tbIiseJMR3pqwiL",
        },
        followers: {
          href: null,
          total: 593257,
        },
        genres: ["metalcore", "modern rock"],
        href: "https://api.spotify.com/v1/artists/6vwjIs0tbIiseJMR3pqwiL",
        id: "6vwjIs0tbIiseJMR3pqwiL",
        images: [
          {
            height: 640,
            url: "https://i.scdn.co/image/ab6761610000e5ebe739a972484b763971bdcbb4",
            width: 640,
          },
          {
            height: 320,
            url: "https://i.scdn.co/image/ab67616100005174e739a972484b763971bdcbb4",
            width: 320,
          },
          {
            height: 160,
            url: "https://i.scdn.co/image/ab6761610000f178e739a972484b763971bdcbb4",
            width: 160,
          },
        ],
        name: "Beartooth",
        popularity: 59,
        type: "artist",
        uri: "spotify:artist:6vwjIs0tbIiseJMR3pqwiL",
      },
      {
        external_urls: {
          spotify: "https://open.spotify.com/artist/5Tt5mAkZsUTKNOQ2xE5ORx",
        },
        followers: {
          href: null,
          total: 10,
        },
        genres: [],
        href: "https://api.spotify.com/v1/artists/5Tt5mAkZsUTKNOQ2xE5ORx",
        id: "5Tt5mAkZsUTKNOQ2xE5ORx",
        images: [
          {
            height: 640,
            url: "https://i.scdn.co/image/ab67616d0000b273d54903f5b10881b7afdd7a46",
            width: 640,
          },
          {
            height: 300,
            url: "https://i.scdn.co/image/ab67616d00001e02d54903f5b10881b7afdd7a46",
            width: 300,
          },
          {
            height: 64,
            url: "https://i.scdn.co/image/ab67616d00004851d54903f5b10881b7afdd7a46",
            width: 64,
          },
        ],
        name: "BearTooth Collective",
        popularity: 0,
        type: "artist",
        uri: "spotify:artist:5Tt5mAkZsUTKNOQ2xE5ORx",
      },
    ],
    limit: 20,
    next: null,
    offset: 0,
    previous: null,
    total: 2,
  },
};

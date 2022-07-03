// eslint-disable-next-line spaced-comment
/// <reference types="spotify-api" />
// See Spotify Object Models: https://developer.spotify.com/documentation/web-api/reference/object-model/

export interface Token {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface Album {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  copyrights: Copyright[];
  external_ids: ExternalIDs;
  external_urls: ExternalURLs;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  label: string;
  name: string;
  popularity: number;
  release_date: string;
  release_date_precision: string;
  restrictions?: Restriction;
  tracks: Paging<Track>;
  type: "album";
  uri: string;
}

export interface Artist {
  external_urls: ExternalURLs;
  followers: Followers[];
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
  type: "artist";
  uri: string;
}

export interface AudioAnalysis {
  bars: TimeInterval[];
  beats: TimeInterval[];
  sections: Section[];
  segments: Segment[];
  tatums: TimeInterval[];
  track: TrackMeta;
}

export interface AudioFeatures {
  acousticness: number;
  analysis_url: string;
  danceability: number;
  duration_ms: number;
  energy: number;
  id: string;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  track_href: string;
  type: "audio_features";
  uri: string;
  valence: number;
}

export interface Category {
  href: string;
  icons: Image[];
  id: string;
  name: string;
}

export interface Context {
  type: string;
  href: string;
  external_urls: ExternalURLs;
  uri: string;
}

export interface Copyright {
  text: string;
  type: string;
}

export interface Cursor {
  after: string;
  before?: string;
}

export interface CursorPaging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  cursors: Cursor;
  total: number;
}

export interface CurrentlyPlaying {
  context: Context;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: Track | Episode | null;
  currently_playing_type: "track" | "episode" | "ad" | "unkown";
  actions: { disallows: Disallows };
}

export interface CurrentlyPlayingContext extends CurrentlyPlaying {
  device: Device;
  repeat_state: string;
  shuffle_state: boolean;
}

export type DeviceType =
  | "Computer"
  | "Tablet"
  | "Smartphone"
  | "Speaker"
  | "TV"
  | "AVR"
  | "STB"
  | "AudioDongle"
  | "GameConsole"
  | "CastVideo"
  | "CastAudio"
  | "Automobile"
  | "Unknown";

export interface Device {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: DeviceType;
  volume_percent: number;
}

export interface Disallows {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
}

export interface Episode {
  audio_preview_url: string | null;
  description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalURLs;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  language?: string; // Deprecated
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: string;
  resume_point?: ResumePoint;
  show?: Show;
  type: "episode";
  uri: string;
}

export interface Error {
  status: number;
  message: string;
}

export interface ExternalIDs {
  [key: string]: string;
}

export interface ExternalURLs {
  // [key: string]: string;
  spotify: string;
}

export interface Followers {
  href: string | null;
  total: number;
}

export interface Image {
  height?: number | null;
  url: string;
  width?: number | null;
}

export interface TimeInterval {
  start: number;
  duration: number;
  confidence: number;
}

export interface TrackLink {
  external_urls: ExternalURLs;
  href: string;
  id: string;
  type: "track";
  uri: string;
}

export interface Paging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface PlayHistory {
  track: Track;
  played_at: number;
  context: Context;
}

export interface Playlist {
  collaborative: boolean;
  description: string | null;
  external_urls: ExternalURLs;
  followers?: Followers[];
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: User;
  public: boolean | null;
  snapshot_id: string;
  tracks: Paging<PlaylistTrack>;
  type: "playlist";
  uri: string;
}

export interface PlaylistTrack {
  added_at: string | null;
  added_by: User | null;
  is_local: boolean;
  track: Track | Episode;
}

export interface PlayerError {
  status: number;
  message: string;
  reason: string;
}

export interface Recommendation {
  seeds: RecommendationSeed[];
  tracks: Track[];
}

export interface RecommendationSeed {
  afterFilteringSize: number;
  afterRelinkingSize: number;
  href: string | null;
  id: string;
  initialPoolSize: number;
  type: "artist" | "track" | "genre";
}

export interface ResumePoint {
  fully_played: boolean;
  resume_position_ms: number;
}

export interface Restriction {
  reason: string;
}

export interface SavedTrack {
  added_at: string;
  track: Track;
}

export interface SavedAlbum {
  added_at: string;
  album: Album;
}

export interface SavedShow {
  added_at: string;
  show: Show;
}

export interface Search {
  artists?: {
    href: string;
    items: Artist[];
  };
  albums?: {
    href: string;
    items: Album[];
  };
  tracks?: {
    href: string;
    items: Track[];
  };
  playlists?: {
    href: string;
    items: Playlist[];
  };
  shows?: {
    href: string;
    items: Show[];
  };
  episodes?: {
    href: string;
    items: Episode[];
  };
}

export interface Section {
  start: number;
  duration: number;
  confidence: number;
  loudness: number;
  tempo: number;
  tempo_confidence: number;
  key: number;
  key_confidence: number;
  mode: number;
  mode_confidence: number;
  time_signature: number;
  time_signature_confidence: number;
}

export interface Segment {
  start: number;
  duration: number;
  confidence: number;
  loudness_start: number;
  loudness_max: number;
  loudness_max_time: number;
  loudness_end: number;
  pitches: number[];
  timbre: number[];
}

export interface Show {
  available_markets?: string[];
  copyrights: Copyright[];
  description: string;
  explicit: boolean;
  episodes?: Paging<Episode>;
  external_urls: ExternalURLs;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean | null;
  languages: string[];
  media_type: string;
  name: string;
  publisher: string;
  type: "show";
  uri: string;
}

export interface Snapshot {
  snapshot_id: string;
}

export interface Track {
  album: Album;
  artists: Artist[];
  available_markets?: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIDs;
  external_urls: ExternalURLs;
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  linked_from?: TrackLink;
  restrictions?: Restriction;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
}

export interface TrackMeta {
  duration: number;
  sample_md5: string;
  offset_seconds: number;
  window_seconds: number;
  analysis_sample_rate: number;
  analysis_channels: number;
  end_of_fade_in: number;
  start_of_fade_out: number;
  loudness: number;
  tempo: number;
  tempo_confidence: number;
  time_signature: number;
  time_signature_confidence: number;
  key: number;
  key_confidence: number;
  mode: number;
  mode_confidence: number;
  codestring: string;
  code_version: number;
  echoprintstring: string;
  echoprint_version: number;
  synchstring: string;
  synch_version: number;
  rhythmstring: string;
  rhythm_version: number;
}

export interface User {
  country?: string;
  display_name?: string;
  email?: string;
  external_urls: ExternalURLs;
  followers: Followers[];
  href: string;
  id: string;
  images: Image[];
  product?: string;
  type: "user";
  uri: string;
}

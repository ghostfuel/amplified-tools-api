import { Operation } from "./index";

export type Source<T, P> = Operation<"source", T, P>;

export type CommonSourceParams = {
  uri?: string;
  limit?: number;
  handleLocalTracks?: "replace" | "remove" | "skip";
};

export interface AlbumSouceParams extends CommonSourceParams {
  artist?: string;
  title?: string;
}
export type AlbumSource = Source<"album", AlbumSouceParams>;

export interface ArtistSouceParams extends CommonSourceParams {
  artist?: string;
  country?: string;
}
export type ArtistSource = Source<"artist", ArtistSouceParams>;

export interface TrackSouceParams {
  uri?: string;
  artist?: string;
  title?: string;
}
export type TrackSource = Source<"track", TrackSouceParams>;

export interface PlaylistSourceParams extends CommonSourceParams {
  user?: string;
  name?: string;
  orderByDateAdded?: "asc" | "desc";
}
export type PlaylistSource = Source<"playlist", PlaylistSourceParams>;

// TODO:
// | "radio"
// | "topTracks"
// | "releaseRadar"
// | "discoverWeekly";
export type SourceOperation = AlbumSource | ArtistSource | TrackSource | PlaylistSource;

export default SourceOperation;

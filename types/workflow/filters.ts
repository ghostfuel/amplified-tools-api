import { Operation } from "./index";

export type Filter<T, P> = Operation<"filter", T, P>;

export interface DedupeFilterParams {
  filter: "artist" | "track" | "album" | "any";
}
export type DedupeFilter = Filter<"dedupe", DedupeFilterParams>;

export interface RemoveFilterParams {
  filter: "artist" | "track" | "album";
  name?: string;
}
export type RemoveFilter = Filter<"remove", RemoveFilterParams>;

export interface AudioFeatureFilterParams {
  audioFeature: string;
  scale?: number;
}
export type AudioFeatureFilter = Filter<"audio-feature", AudioFeatureFilterParams>;

export interface DateFilterParams {
  newerThan?: string;
  olderThan?: string;
}
export type DateFilter = Filter<"date", DateFilterParams>;

export type FilterOperation = DedupeFilter | RemoveFilter | AudioFeatureFilter | DateFilter;

export default FilterOperation;

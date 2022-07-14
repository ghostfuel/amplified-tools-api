import { Operation } from "./index";

export type Sorter<T, P> = Operation<"sorter", T, P>;

export type CommonSorterParams = {
  order?: "asc" | "desc";
};

export interface SortBySorterParams extends CommonSorterParams {
  property?: "artists" | "album.name" | "name" | string;
}
export type SortBySorter = Sorter<"sortBy", SortBySorterParams>;

export type ReverseSorter = Sorter<"reverse", undefined>;

export type ShuffleSorter = Sorter<"shuffle", undefined>;

export interface SeperatedSorterParams {
  seperator?: "artist" | "album";
}
export type SeperatedSorter = Sorter<"seperated", SeperatedSorterParams>;

export type SorterOperation = SortBySorter | ReverseSorter | ShuffleSorter | SeperatedSorter;

export default SorterOperation;

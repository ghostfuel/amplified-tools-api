import { Token } from "../spotify";
import ActionOperation from "./actions";
import FilterOperation from "./filters";
import SelectorOperation from "./selectors";
import SorterOperation from "./sorters";
import SourceOperation from "./sources";

export interface Operation<O, T, P> {
  operation: O;
  type: T;
  params: P;
  inputs: number[];
  outputs: number[];
  results: SpotifyApi.TrackObjectFull[];
}

export type UnknownOperation = Operation<unknown, unknown, unknown>;
export type Operations =
  | SourceOperation
  | SelectorOperation
  | SorterOperation
  | FilterOperation
  | ActionOperation;

type Workflow = {
  operations: Operations[];
  errors: Error[];
  results: SpotifyApi.TrackObjectFull[];
  spotifyTokens?: Token;
};

export default Workflow;

import { Operation } from "./index";

export type Selector<T, P> = Operation<"selector", T, P>;

export type CommonSelectorParams = {
  // TODO:  stopOnError?: boolean;
  dedupe?: boolean;
  limit?: number;
};

export type AlternateSelector = Selector<"alternate", CommonSelectorParams>;
export type ConcatenateSelector = Selector<"concatenate", CommonSelectorParams>;
export type MixSelector = Selector<"mix", CommonSelectorParams>;
export type RandomSelector = Selector<"random", CommonSelectorParams>;
export type LimitSelector = Selector<"limit", CommonSelectorParams>;

export type SelectorOperation =
  | AlternateSelector
  | ConcatenateSelector
  | MixSelector
  | RandomSelector
  | LimitSelector;

export default SelectorOperation;

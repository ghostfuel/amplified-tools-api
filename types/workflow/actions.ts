import { Operation } from "./index";

export type Action<T, P> = Operation<"action", T, P>;

export interface SaveActionParams {
  name?: string;
  description?: string;
  uri?: string;
  append?: boolean;
  reorder?: boolean;
}
export type SaveAction = Action<"save", SaveActionParams>;

export type ActionOperation = SaveAction;

export default ActionOperation;

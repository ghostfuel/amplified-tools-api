import { Operation } from "./index";

export type Action<T, P> = Operation<"action", T, P>;

export interface SaveActionParams {
  uri?: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
  isCollaborative?: boolean;
  append?: boolean;
  reorder?: boolean;
}
export type SaveAction = Action<"save", SaveActionParams>;

export type ActionOperation = SaveAction;

export default ActionOperation;

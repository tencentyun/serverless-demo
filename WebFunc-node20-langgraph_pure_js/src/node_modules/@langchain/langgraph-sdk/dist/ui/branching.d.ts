import { ThreadState } from "../schema.js";

//#region src/ui/branching.d.ts
interface Node<StateType = any> {
  type: "node";
  value: ThreadState<StateType>;
  path: string[];
}
interface Fork<StateType = any> {
  type: "fork";
  items: Array<Sequence<StateType>>;
}
interface Sequence<StateType = any> {
  type: "sequence";
  items: Array<Node<StateType> | Fork<StateType>>;
}
//#endregion
export { Sequence };
//# sourceMappingURL=branching.d.ts.map
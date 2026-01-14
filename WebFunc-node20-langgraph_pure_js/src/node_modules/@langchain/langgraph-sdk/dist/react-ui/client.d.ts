import { BagTemplate } from "../types.template.js";
import { UseStream, UseStreamCustom } from "../react/types.js";
import { UIMessage } from "./types.js";
import { useStream } from "../react/stream.js";
import * as React from "react";
import * as JsxRuntime from "react/jsx-runtime";

//#region src/react-ui/client.d.ts
declare const UseStreamContext: React.Context<{
  stream: UseStreamCustom<Record<string, unknown>, BagTemplate>;
  meta: unknown;
}>;
type GetMetaType<Bag extends BagTemplate> = Bag extends {
  MetaType: unknown;
} ? Bag["MetaType"] : unknown;
interface UseStreamContext<StateType extends Record<string, unknown> = Record<string, unknown>, Bag extends BagTemplate = BagTemplate> extends UseStream<StateType, Bag> {
  meta?: GetMetaType<Bag>;
}
declare function useStreamContext<StateType extends Record<string, unknown> = Record<string, unknown>, Bag extends BagTemplate = BagTemplate>(): UseStreamContext<StateType, Bag>;
interface ComponentTarget {
  comp: React.FunctionComponent | React.ComponentClass;
  target: HTMLElement;
}
declare class ComponentStore {
  private cache;
  private boundCache;
  private callbacks;
  respond(shadowRootId: string, comp: React.FunctionComponent | React.ComponentClass, targetElement: HTMLElement): void;
  getBoundStore(shadowRootId: string): {
    subscribe: (onStoreChange: () => void) => () => void;
    getSnapshot: () => ComponentTarget | undefined;
  };
}
declare const EXT_STORE_SYMBOL: unique symbol;
declare const REQUIRE_SYMBOL: unique symbol;
declare const REQUIRE_EXTRA_SYMBOL: unique symbol;
interface LoadExternalComponentProps extends Pick<React.HTMLAttributes<HTMLDivElement>, "style" | "className"> {
  /** Stream of the assistant */
  stream: ReturnType<typeof useStream>;
  /** Namespace of UI components. Defaults to assistant ID. */
  namespace?: string;
  /** UI message to be rendered */
  message: UIMessage;
  /** Additional context to be passed to the child component */
  meta?: unknown;
  /** Fallback to be rendered when the component is loading */
  fallback?: React.ReactNode | Record<string, React.ReactNode>;
  /**
   * Map of components that can be rendered directly without fetching the UI code
   * from the server.
   */
  components?: Record<string, React.FunctionComponent | React.ComponentClass>;
}
declare function LoadExternalComponent({
  stream,
  namespace,
  message,
  meta,
  fallback,
  components,
  ...props
}: LoadExternalComponentProps): JsxRuntime.JSX.Element;
declare global {
  interface Window {
    [EXT_STORE_SYMBOL]: ComponentStore;
    [REQUIRE_SYMBOL]: (name: string) => unknown;
    [REQUIRE_EXTRA_SYMBOL]: Record<string, unknown>;
  }
}
declare function experimental_loadShare(name: string, module: unknown): void;
//#endregion
export { LoadExternalComponent, experimental_loadShare, useStreamContext };
//# sourceMappingURL=client.d.ts.map
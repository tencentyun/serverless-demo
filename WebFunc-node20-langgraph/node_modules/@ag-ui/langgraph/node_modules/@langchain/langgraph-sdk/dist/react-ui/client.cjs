"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStreamContext = useStreamContext;
exports.LoadExternalComponent = LoadExternalComponent;
exports.experimental_loadShare = experimental_loadShare;
exports.bootstrapUiContext = bootstrapUiContext;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const ReactDOM = __importStar(require("react-dom"));
const JsxRuntime = __importStar(require("react/jsx-runtime"));
const index_js_1 = require("../react/index.cjs");
const UseStreamContext = React.createContext(null);
function useStreamContext() {
    const ctx = React.useContext(UseStreamContext);
    if (!ctx) {
        throw new Error("useStreamContext must be used within a LoadExternalComponent");
    }
    return new Proxy(ctx, {
        get(target, prop) {
            if (prop === "meta")
                return target.meta;
            return target.stream[prop];
        },
    });
}
class ComponentStore {
    constructor() {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "boundCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    respond(shadowRootId, comp, targetElement) {
        this.cache[shadowRootId] = { comp, target: targetElement };
        this.callbacks[shadowRootId]?.forEach((c) => c(comp, targetElement));
    }
    getBoundStore(shadowRootId) {
        this.boundCache[shadowRootId] ??= {
            subscribe: (onStoreChange) => {
                this.callbacks[shadowRootId] ??= [];
                this.callbacks[shadowRootId].push(onStoreChange);
                return () => {
                    this.callbacks[shadowRootId] = this.callbacks[shadowRootId].filter((c) => c !== onStoreChange);
                };
            },
            getSnapshot: () => this.cache[shadowRootId],
        };
        return this.boundCache[shadowRootId];
    }
}
const COMPONENT_STORE = new ComponentStore();
const EXT_STORE_SYMBOL = Symbol.for("LGUI_EXT_STORE");
const REQUIRE_SYMBOL = Symbol.for("LGUI_REQUIRE");
const REQUIRE_EXTRA_SYMBOL = Symbol.for("LGUI_REQUIRE_EXTRA");
const isIterable = (value) => value != null && typeof value === "object" && Symbol.iterator in value;
const isPromise = (value) => value != null &&
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function";
const isReactNode = (value) => {
    if (React.isValidElement(value))
        return true;
    if (value == null)
        return true;
    if (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "bigint" ||
        typeof value === "boolean") {
        return true;
    }
    if (isIterable(value))
        return true;
    if (isPromise(value))
        return true;
    return false;
};
function LoadExternalComponent({ stream, namespace, message, meta, fallback, components, ...props }) {
    const ref = React.useRef(null);
    const id = React.useId();
    const shadowRootId = `child-shadow-${id}`;
    const store = React.useMemo(() => COMPONENT_STORE.getBoundStore(shadowRootId), [shadowRootId]);
    const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
    const clientComponent = components?.[message.name];
    const hasClientComponent = clientComponent != null;
    let fallbackComponent = null;
    if (isReactNode(fallback)) {
        fallbackComponent = fallback;
    }
    else if (typeof fallback === "object" && fallback != null) {
        fallbackComponent = fallback?.[message.name];
    }
    const uiNamespace = namespace ?? stream.assistantId;
    const uiClient = stream.client["~ui"];
    React.useEffect(() => {
        if (hasClientComponent)
            return;
        void uiClient.getComponent(uiNamespace, message.name).then((html) => {
            const dom = ref.current;
            if (!dom)
                return;
            const root = dom.shadowRoot ?? dom.attachShadow({ mode: "open" });
            const fragment = document
                .createRange()
                .createContextualFragment(html.replace("{{shadowRootId}}", shadowRootId));
            root.appendChild(fragment);
        });
    }, [uiClient, uiNamespace, message.name, shadowRootId, hasClientComponent]);
    if (hasClientComponent) {
        return ((0, jsx_runtime_1.jsx)(UseStreamContext.Provider, { value: { stream, meta }, children: React.createElement(clientComponent, message.props) }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { id: shadowRootId, ref: ref, ...props }), (0, jsx_runtime_1.jsx)(UseStreamContext.Provider, { value: { stream, meta }, children: state?.target != null
                    ? ReactDOM.createPortal(React.createElement(state.comp, message.props), state.target)
                    : fallbackComponent })] }));
}
function experimental_loadShare(name, module) {
    if (typeof window === "undefined")
        return;
    window[REQUIRE_EXTRA_SYMBOL] ??= {};
    window[REQUIRE_EXTRA_SYMBOL][name] = module;
}
function bootstrapUiContext() {
    if (typeof window === "undefined") {
        return;
    }
    window[EXT_STORE_SYMBOL] = COMPONENT_STORE;
    window[REQUIRE_SYMBOL] = (name) => {
        if (name === "react")
            return React;
        if (name === "react-dom")
            return ReactDOM;
        if (name === "react/jsx-runtime")
            return JsxRuntime;
        if (name === "@langchain/langgraph-sdk/react")
            return { useStream: index_js_1.useStream };
        if (name === "@langchain/langgraph-sdk/react-ui") {
            return {
                useStreamContext,
                LoadExternalComponent: () => {
                    throw new Error("Nesting LoadExternalComponent is not supported");
                },
            };
        }
        if (window[REQUIRE_EXTRA_SYMBOL] != null &&
            typeof window[REQUIRE_EXTRA_SYMBOL] === "object" &&
            name in window[REQUIRE_EXTRA_SYMBOL]) {
            return window[REQUIRE_EXTRA_SYMBOL][name];
        }
        throw new Error(`Unknown module...: ${name}`);
    };
}

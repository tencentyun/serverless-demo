export interface UIMessage<TName extends string = string, TProps extends Record<string, unknown> = Record<string, unknown>> {
    type: "ui";
    id: string;
    name: TName;
    props: TProps;
    metadata?: {
        merge?: boolean;
        run_id?: string;
        name?: string;
        tags?: string[];
        message_id?: string;
        [key: string]: unknown;
    };
}
export interface RemoveUIMessage {
    type: "remove-ui";
    id: string;
}
export declare function isUIMessage(message: unknown): message is UIMessage;
export declare function isRemoveUIMessage(message: unknown): message is RemoveUIMessage;
export declare function uiMessageReducer(state: UIMessage[], update: UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]): UIMessage<string, Record<string, unknown>>[];

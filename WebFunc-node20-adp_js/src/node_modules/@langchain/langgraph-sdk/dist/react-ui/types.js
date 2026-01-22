export function isUIMessage(message) {
    if (typeof message !== "object" || message == null)
        return false;
    if (!("type" in message))
        return false;
    return message.type === "ui";
}
export function isRemoveUIMessage(message) {
    if (typeof message !== "object" || message == null)
        return false;
    if (!("type" in message))
        return false;
    return message.type === "remove-ui";
}
export function uiMessageReducer(state, update) {
    const events = Array.isArray(update) ? update : [update];
    let newState = state.slice();
    for (const event of events) {
        if (event.type === "remove-ui") {
            newState = newState.filter((ui) => ui.id !== event.id);
            continue;
        }
        const index = state.findIndex((ui) => ui.id === event.id);
        if (index !== -1) {
            newState[index] =
                typeof event.metadata === "object" &&
                    event.metadata != null &&
                    event.metadata.merge
                    ? { ...event, props: { ...state[index].props, ...event.props } }
                    : event;
        }
        else {
            newState.push(event);
        }
    }
    return newState;
}

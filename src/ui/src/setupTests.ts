import {TextDecoder, TextEncoder} from "util";

import "@testing-library/jest-dom";

// jsdom lays nothing out and ships neither of these, so the browser APIs our
// dependencies reach for on import or mount are stubbed here.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

// A data router describes each navigation as a `Request`, which jsdom lacks.
// No route here has a loader to read one, so only the shape matters.
class RequestStub {
    url: string;
    method: string;
    signal?: AbortSignal;

    constructor(url: string, init: {method?: string; signal?: AbortSignal} = {}) {
        this.url = url;
        this.method = init.method ?? "GET";
        this.signal = init.signal;
    }
}

Object.assign(global, {
    TextDecoder,
    TextEncoder,
    ResizeObserver: ResizeObserverStub,
    Request: RequestStub,
});

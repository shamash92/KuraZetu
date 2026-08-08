import {TextDecoder, TextEncoder} from "util";

import "@testing-library/jest-dom";

// jsdom lays nothing out and ships neither of these, so the browser APIs our
// dependencies reach for on import or mount are stubbed here.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.assign(global, {
    TextDecoder,
    TextEncoder,
    ResizeObserver: ResizeObserverStub,
});

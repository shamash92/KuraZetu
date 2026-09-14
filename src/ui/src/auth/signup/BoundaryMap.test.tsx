import {render, screen} from "@testing-library/react";
import type {LatLngBounds} from "leaflet";
import type {ReactNode} from "react";

import BoundaryMap from "./BoundaryMap";

jest.mock("react-leaflet", () => ({
    MapContainer: ({children}: {children: ReactNode}) => <div>{children}</div>,
    TileLayer: ({url}: {url: string}) => <div data-testid="tile-layer" data-url={url} />,
    useMap: () => ({fitBounds: jest.fn()}),
}));

const bounds = {} as LatLngBounds;

describe("BoundaryMap", () => {
    it("uses Google Street tiles by default", () => {
        render(<BoundaryMap bounds={bounds} />);

        expect(screen.getByTestId("tile-layer")).toHaveAttribute(
            "data-url",
            "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        );
    });

    it("uses Google satellite tiles when requested", () => {
        render(<BoundaryMap bounds={bounds} basemap="satellite" />);

        expect(screen.getByTestId("tile-layer")).toHaveAttribute(
            "data-url",
            "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        );
    });
});

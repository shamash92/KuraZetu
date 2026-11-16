import {render, screen, within} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {StationUploads} from "./StationUploads";

function show(body: unknown) {
    global.fetch = jest.fn(() =>
        Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)}),
    ) as unknown as typeof fetch;
    render(
        <QueryClientProvider client={new QueryClient()}>
            <StationUploads
                station={{level: "station", id: 9, name: "Centre · Station 1"}}
            />
        </QueryClientProvider>,
    );
}

test("uploads that disagree are compared side by side with their photos", async () => {
    show({
        station: {level: "station", id: 9, name: "Centre · Station 1"},
        candidates: [
            {id: 1, name: "Amina Otieno"},
            {id: 2, name: "Brian Kamau"},
        ],
        uploads: [
            {id: "a", votes: {1: 20, 2: 10}, rejected: 1, disputed: 0, agreed: 2},
            {id: "b", votes: {1: 25, 2: 10}, rejected: 1, disputed: 0, agreed: 0},
        ],
    });

    expect(await screen.findByText("Uploads disagree")).toBeInTheDocument();
    expect(screen.getByAltText("Form photo, upload 1")).toHaveAttribute(
        "src",
        "/api/results/dashboard/uploads/a/photo/",
    );
    expect(screen.getByText("Agreed by 2 people")).toBeInTheDocument();
    const amina = screen.getByRole("row", {name: /Amina Otieno/});
    expect(amina).toHaveClass("rd-differs");
    expect(within(amina).getByText("25")).toBeInTheDocument();
    expect(screen.getByRole("row", {name: /Brian Kamau/})).not.toHaveClass(
        "rd-differs",
    );
});

test("a station with no counted upload says so", async () => {
    show({station: {level: "station", id: 9, name: "S"}, candidates: [], uploads: []});

    expect(
        await screen.findByText(/No upload has been counted at this station yet/),
    ).toBeInTheDocument();
});

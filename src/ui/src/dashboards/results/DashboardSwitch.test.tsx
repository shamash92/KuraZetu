import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {DashboardSwitch} from "./DashboardSwitch";

test("the dashboards list opens from the top bar and closes with Escape", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    dashboards: [
                        {
                            id: 4,
                            name: "Newsroom",
                            kind: "media",
                            url: "/ui/dashboards/user/",
                        },
                    ],
                }),
        }),
    ) as unknown as typeof fetch;
    render(
        <QueryClientProvider client={new QueryClient()}>
            <DashboardSwitch current={4} />
        </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", {name: "Dashboards"}));
    expect(await screen.findByRole("link", {name: "Newsroom"})).toHaveAttribute(
        "aria-current",
        "page",
    );
    expect(screen.getByRole("link", {name: "Public results"})).toHaveAttribute(
        "href",
        "/ui/",
    );
    expect(global.fetch).toHaveBeenCalledWith(
        "/api/results/dashboard/list/",
        expect.anything(),
    );

    await user.keyboard("{Escape}");
    expect(
        screen.queryByRole("link", {name: "Public results"}),
    ).not.toBeInTheDocument();
});

import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {LandingNav} from "./index";

jest.mock("../App", () => ({useAuth: () => false}));

test("the blog and design pages are linked from desktop and mobile navigation", async () => {
    const user = userEvent.setup();
    render(
        <QueryClientProvider client={new QueryClient()}>
            <LandingNav />
        </QueryClientProvider>,
    );

    expect(
        within(screen.getByRole("navigation", {name: "Main navigation"})).getByRole(
            "link",
            {name: "Blog"},
        ),
    ).toHaveAttribute("href", "/blog/");
    // The brand guide and the component catalog sit together under Design.
    const design = screen.getByText("Design").closest("details")!;
    expect(
        within(design)
            .getAllByRole("link", {hidden: true})
            .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
        ["Brand", "/ui/brand/"],
        ["Components", "/components/"],
    ]);

    // What a developer needs sits together under one entry.
    const developers = screen.getByText("Developers").closest("details")!;
    expect(
        within(developers)
            .getAllByRole("link", {hidden: true})
            .map((link) => link.textContent),
    ).toEqual(["Specs", "API", "Contribute"]);

    await user.click(screen.getByRole("button", {name: "Open navigation"}));

    expect(
        within(
            screen.getByRole("navigation", {name: "Mobile navigation"}),
        ).getByRole("link", {name: "Blog"}),
    ).toHaveAttribute("href", "/blog/");
    const mobile = within(
        screen.getByRole("navigation", {name: "Mobile navigation"}),
    );
    await user.click(mobile.getByText("Design"));
    expect(mobile.getByRole("link", {name: "Brand"})).toHaveAttribute(
        "href",
        "/ui/brand/",
    );
});

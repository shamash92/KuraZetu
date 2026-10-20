import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {LandingNav} from "./index";

jest.mock("../App", () => ({useAuth: () => false}));

test("the blog and brand pages are linked from desktop and mobile navigation", async () => {
    const user = userEvent.setup();
    render(<LandingNav />);

    expect(
        within(screen.getByRole("navigation", {name: "Main navigation"})).getByRole(
            "link",
            {name: "Blog"},
        ),
    ).toHaveAttribute("href", "/blog/");
    expect(
        within(screen.getByRole("navigation", {name: "Main navigation"})).getByRole(
            "link",
            {name: "Brand"},
        ),
    ).toHaveAttribute("href", "/ui/brand/");

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
    expect(
        within(
            screen.getByRole("navigation", {name: "Mobile navigation"}),
        ).getByRole("link", {name: "Brand"}),
    ).toHaveAttribute("href", "/ui/brand/");
});

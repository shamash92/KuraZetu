import {render, screen} from "@testing-library/react";

import {Diagram} from "./Diagram";

const mockMermaid = {initialize: jest.fn(), render: jest.fn()};
jest.mock("mermaid", () => ({__esModule: true, default: mockMermaid}));

const SOURCE = `%%{init: {"securityLevel": "loose"}}%%
graph TD
    A --> B
`;

test("a diagram is drawn as a static picture that cannot reconfigure the renderer", async () => {
    mockMermaid.render.mockResolvedValue({svg: "<svg><title>Flow</title></svg>"});
    render(<Diagram source={SOURCE} showError={false} />);

    expect(await screen.findByTitle("Flow")).toBeInTheDocument();
    expect(mockMermaid.initialize).toHaveBeenCalledWith(
        expect.objectContaining({securityLevel: "strict"}),
    );
    const drawn = mockMermaid.render.mock.calls[0][1];
    expect(drawn).toContain("A --> B");
    expect(drawn).not.toContain("init");
});

test("a diagram that cannot be drawn falls back to its source, with the reason for the author", async () => {
    mockMermaid.render.mockRejectedValue(new Error("Parse error on line 2"));

    const reader = render(<Diagram source={SOURCE} showError={false} />);
    expect(screen.getByText(/A --> B/)).toBeInTheDocument();
    await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
    reader.unmount();

    render(<Diagram source={SOURCE} showError />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
        "This diagram cannot be drawn: Parse error on line 2",
    );
    expect(screen.getByText(/A --> B/)).toBeInTheDocument();
});

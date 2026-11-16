import {useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {
    fetchDashboard,
    shapesUrl,
    shortCache,
    type Area,
    type Geometry,
    type Results,
    type Shapes,
    type Tally,
} from "./dashboardApi";
import {follows, leaders, myVotes, names, number, position, standing} from "./tally";

type Child = Area & Tally;
type Point = [number, number];
type Fill = "lead" | "trail" | "tied" | "reported" | "none";

const WIDTH = 700;
const MAX_HEIGHT = 520;
const PAD = 12;
// Above this many outlines the names overlap, so they move to the caption.
const MAX_LABELS = 12;

function rings(geometry: Geometry): Array<Array<Point>> {
    if (geometry.type === "Point") return [];
    if (geometry.type === "Polygon") return geometry.coordinates;
    return geometry.coordinates.flat();
}

function corners(geometry: Geometry): Array<Point> {
    return geometry.type === "Point" ? [geometry.coordinates] : rings(geometry).flat();
}

/** Turns longitude and latitude into SVG points, keeping the map's proportions. */
function projection(geometries: Array<Geometry>) {
    const all = geometries.flatMap(corners);
    let [west, east] = [
        Math.min(...all.map((p) => p[0])),
        Math.max(...all.map((p) => p[0])),
    ];
    let [south, north] = [
        Math.min(...all.map((p) => p[1])),
        Math.max(...all.map((p) => p[1])),
    ];
    if (east - west < 0.01) [west, east] = [west - 0.005, east + 0.005];
    if (north - south < 0.01) [south, north] = [south - 0.005, north + 0.005];
    const squeeze = Math.cos((((north + south) / 2) * Math.PI) / 180);
    const scale = Math.min(
        (WIDTH - 2 * PAD) / ((east - west) * squeeze),
        (MAX_HEIGHT - 2 * PAD) / (north - south),
    );
    return {
        width: (east - west) * squeeze * scale + 2 * PAD,
        height: (north - south) * scale + 2 * PAD,
        at: ([lon, lat]: Point): Point => [
            PAD + (lon - west) * squeeze * scale,
            PAD + (north - lat) * scale,
        ],
    };
}

function path(points: Array<Point>) {
    return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
}

/** The middle of the largest ring, where the area's name goes. */
function middle(outline: Array<Array<Point>>): Point {
    let best: Point = outline[0][0];
    let most = 0;
    for (const ring of outline) {
        let area = 0;
        let [x, y] = [0, 0];
        ring.forEach(([x1, y1], index) => {
            const [x2, y2] = ring[(index + 1) % ring.length];
            const cross = x1 * y2 - x2 * y1;
            area += cross;
            x += (x1 + x2) * cross;
            y += (y1 + y2) * cross;
        });
        if (Math.abs(area) > most) {
            most = Math.abs(area);
            best = [x / (3 * area), y / (3 * area)];
        }
    }
    return best;
}

function fillOf(child: Child, showsFocus: boolean): Fill {
    const {label} = standing(child);
    if (label === "Tied") return "tied";
    if (label !== "Leading" && label !== "Trailing") return "none";
    if (!showsFocus) return "reported";
    return label === "Leading" ? "lead" : "trail";
}

function figure(child: Child, showsFocus: boolean) {
    if (fillOf(child, showsFocus) === "none") return standing(child).label;
    if (!showsFocus) return names(leaders(child));
    return `${position(child)} · ${number.format(myVotes(child) ?? 0)} votes`;
}

function describe(child: Child, showsFocus: boolean) {
    return `${child.name}: ${figure(child, showsFocus)}, ${number.format(child.reported)} of ${number.format(child.stations)} stations reported`;
}

function Legend({data, showsFocus}: {data: Results; showsFocus: boolean}) {
    const whose = data.focus ?? "";
    const items: Array<[Fill, string]> = showsFocus
        ? [
              ["lead", `${whose} leading`],
              ["trail", `${whose} trailing`],
              ["tied", "Tied"],
              ["none", "No results"],
          ]
        : [
              ["reported", "Has results"],
              ["tied", "Tied"],
              ["none", "No results"],
          ];
    return (
        <ul className="rd-legend">
            {items.map(([fill, label]) => (
                <li key={fill}>
                    <i className={`rd-key-${fill}`} aria-hidden="true" />
                    {label}
                </li>
            ))}
        </ul>
    );
}

function Drawing({
    data,
    outline,
    shapes,
    onOpen,
}: {
    data: Results;
    outline: Geometry | null;
    shapes: Map<number, Geometry>;
    onOpen: (area: Area) => void;
}) {
    const [hover, setHover] = useState<Child | null>(null);
    const showsFocus = follows(data.summary);
    const placed = data.children.filter((child) => shapes.has(Number(child.id)));
    const drawn = placed.map((child) => shapes.get(Number(child.id))!);
    // Centre pins need the ward around them; outlines already fill the area,
    // and a coarser parent outline would show around their edges.
    const backdrop = drawn.every((geometry) => geometry.type === "Point")
        ? outline
        : null;
    const map = projection(backdrop ? [backdrop, ...drawn] : drawn);
    const labelled = placed.length <= MAX_LABELS;
    return (
        <>
            <svg
                viewBox={`0 0 ${map.width.toFixed(0)} ${map.height.toFixed(0)}`}
                role="group"
                aria-label={`Map of ${data.area.name}`}
            >
                <defs>
                    <pattern
                        id="rd-hatch"
                        width="8"
                        height="8"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="8" height="8" fill="#efeeea" />
                        <rect width="2" height="8" fill="#e1e0da" />
                    </pattern>
                </defs>
                {backdrop && (
                    <path
                        className="rd-outline"
                        d={rings(backdrop)
                            .map((ring) => path(ring.map(map.at)))
                            .join("")}
                    />
                )}
                {placed.map((child) => {
                    const geometry = shapes.get(Number(child.id))!;
                    const fill = fillOf(child, showsFocus);
                    const outline = rings(geometry).map((ring) => ring.map(map.at));
                    const open = () => onOpen(child);
                    return (
                        <g
                            key={child.id}
                            className={`rd-shape rd-fill-${fill}`}
                            role="button"
                            tabIndex={0}
                            aria-label={describe(child, showsFocus)}
                            onClick={open}
                            onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                open();
                            }}
                            onMouseEnter={() => setHover(child)}
                            onMouseLeave={() => setHover(null)}
                            onFocus={() => setHover(child)}
                            onBlur={() => setHover(null)}
                        >
                            {geometry.type === "Point" ? (
                                <circle
                                    cx={map.at(geometry.coordinates)[0]}
                                    cy={map.at(geometry.coordinates)[1]}
                                    r="8"
                                />
                            ) : (
                                <path d={outline.map(path).join("")} />
                            )}
                        </g>
                    );
                })}
                {labelled &&
                    placed.map((child) => {
                        const geometry = shapes.get(Number(child.id))!;
                        const point = geometry.type === "Point";
                        const [x, y] = point
                            ? map.at(geometry.coordinates).map((n, i) => n + i * 26)
                            : middle(rings(geometry).map((ring) => ring.map(map.at)));
                        const dark =
                            !point &&
                            ["lead", "reported"].includes(fillOf(child, showsFocus));
                        return (
                            <text
                                key={child.id}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                className={dark ? "rd-on-dark" : undefined}
                                aria-hidden="true"
                            >
                                {child.name}
                                <tspan x={x} dy="17">
                                    {figure(child, showsFocus)}
                                </tspan>
                            </text>
                        );
                    })}
            </svg>
            <p className="rd-map-note">{hover ? describe(hover, showsFocus) : " "}</p>
            <Legend data={data} showsFocus={showsFocus} />
        </>
    );
}

/** The areas one level down drawn on a map, shaded by the same figures as the list. */
export function AreaMap({data, onOpen}: {data: Results; onOpen: (area: Area) => void}) {
    const query = useQuery({
        queryKey: ["dashboard-shapes", data.area],
        queryFn: ({signal}) => fetchDashboard<Shapes>(shapesUrl(data.area), signal),
        ...shortCache,
    });
    if (query.isPending) {
        return (
            <p role="status" className="rd-empty">
                Loading map…
            </p>
        );
    }
    if (query.isError) return <p role="alert">{query.error.message}</p>;
    const shapes = new Map<number, Geometry>();
    for (const shape of query.data.shapes) {
        if (shape.geometry) shapes.set(shape.id, shape.geometry);
    }
    const missing = data.children.filter((child) => !shapes.has(Number(child.id)));
    return (
        <div className="rd-map">
            {missing.length < data.children.length ? (
                <Drawing
                    data={data}
                    outline={query.data.outline}
                    shapes={shapes}
                    onOpen={onOpen}
                />
            ) : (
                <p className="rd-empty">None of these areas has a map location.</p>
            )}
            {missing.length > 0 && missing.length < data.children.length && (
                <p className="rd-empty">
                    No map location for {missing.map((child) => child.name).join(", ")}.
                </p>
            )}
        </div>
    );
}

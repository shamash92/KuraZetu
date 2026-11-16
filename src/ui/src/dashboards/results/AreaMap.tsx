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
    const [hot, setHot] = useState<number | null>(null);
    const showsFocus = follows(data.summary);
    const placed = data.children.filter((child) => shapes.has(Number(child.id)));
    // The highlighted shape is drawn last so its outline sits on top.
    const ordered = [...placed].sort(
        (a, b) => Number(Number(a.id) === hot) - Number(Number(b.id) === hot),
    );
    const drawn = placed.map((child) => shapes.get(Number(child.id))!);
    // Centre pins need the ward around them; outlines already fill the area,
    // and a coarser parent outline would show around their edges.
    const backdrop = drawn.every((geometry) => geometry.type === "Point")
        ? outline
        : null;
    const map = projection(backdrop ? [backdrop, ...drawn] : drawn);
    return (
        <div className="rd-map-body">
            <div>
                <svg
                    viewBox={`0 0 ${map.width.toFixed(0)} ${map.height.toFixed(0)}`}
                    aria-hidden="true"
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
                    {ordered.map((child) => {
                        const id = Number(child.id);
                        const geometry = shapes.get(id)!;
                        const fill = fillOf(child, showsFocus);
                        const outline = rings(geometry).map((ring) => ring.map(map.at));
                        return (
                            <g
                                key={child.id}
                                data-area={child.id}
                                className={`rd-shape rd-fill-${fill}${hot === id ? " rd-hot" : ""}`}
                                onClick={() => onOpen(child)}
                                onMouseEnter={() => setHot(id)}
                                onMouseLeave={() => setHot(null)}
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
                </svg>
                <Legend data={data} showsFocus={showsFocus} />
            </div>
            <ul className="rd-map-list" aria-label={`Areas in ${data.area.name}`}>
                {placed.map((child) => {
                    const id = Number(child.id);
                    return (
                        <li key={child.id}>
                            <button
                                type="button"
                                className={`rd-mrow${hot === id ? " rd-hot" : ""}`}
                                aria-label={describe(child, showsFocus)}
                                onClick={() => onOpen(child)}
                                onMouseEnter={() => setHot(id)}
                                onMouseLeave={() => setHot(null)}
                                onFocus={() => setHot(id)}
                                onBlur={() => setHot(null)}
                            >
                                <i
                                    className={`rd-key-${fillOf(child, showsFocus)}`}
                                    aria-hidden="true"
                                />
                                <span>
                                    <b>{child.name}</b>
                                    <small>{figure(child, showsFocus)}</small>
                                </span>
                                <em>
                                    {number.format(child.reported)}/
                                    {number.format(child.stations)}
                                </em>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
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

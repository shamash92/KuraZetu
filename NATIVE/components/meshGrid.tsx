import Svg, {Defs, G, Line, Mask, RadialGradient, Rect, Stop} from "react-native-svg";

import {StyleSheet, View} from "react-native";

import {MESH_GRID} from "../app/_utils/colors";
import {useState} from "react";

interface IMeshGridProps {
    /** Distance between lines, in points. */
    spacing?: number;
    color?: string;
    lineWidth?: number;
    /**
     * Radial falloff, 0–1. At 0 the grid is flat to the edges; at 1 it is only
     * visible at the centre. Softens the lattice so it reads as texture rather
     * than as a table.
     */
    fade?: number;
    /** Where the falloff is brightest, as a fraction of the box. */
    fadeCenter?: {x: number; y: number};
}

/**
 * Faint graph-paper lattice, the app's `--mesh-grid` backdrop. Fills its parent
 * and ignores touches, so it can be dropped in as a sibling of real content.
 */
export default function MeshGrid({
    spacing = 40,
    color = MESH_GRID,
    lineWidth = 1,
    fade = 0,
    fadeCenter = {x: 0.5, y: 0.5},
}: IMeshGridProps) {
    const [box, setBox] = useState({width: 0, height: 0});

    const columns = Math.ceil(box.width / spacing) + 1;
    const rows = Math.ceil(box.height / spacing) + 1;
    // 0 keeps the grid whole; 1 pulls the opaque core all the way to a point.
    const coreStop = `${Math.round((1 - Math.min(Math.max(fade, 0), 1)) * 100)}%`;

    const lattice = (
        <G>
            {Array.from({length: columns}, (_, i) => (
                <Line
                    key={`c${i}`}
                    x1={i * spacing}
                    y1={0}
                    x2={i * spacing}
                    y2={box.height}
                    stroke={color}
                    strokeWidth={lineWidth}
                />
            ))}
            {Array.from({length: rows}, (_, i) => (
                <Line
                    key={`r${i}`}
                    x1={0}
                    y1={i * spacing}
                    x2={box.width}
                    y2={i * spacing}
                    stroke={color}
                    strokeWidth={lineWidth}
                />
            ))}
        </G>
    );

    return (
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            onLayout={(e) => setBox(e.nativeEvent.layout)}
        >
            {box.width > 0 && (
                <Svg width={box.width} height={box.height}>
                    {fade > 0 ? (
                        <>
                            <Defs>
                                <RadialGradient
                                    id="meshFade"
                                    cx={`${fadeCenter.x * 100}%`}
                                    cy={`${fadeCenter.y * 100}%`}
                                    r="75%"
                                >
                                    <Stop
                                        offset="0%"
                                        stopColor="#fff"
                                        stopOpacity={1}
                                    />
                                    <Stop
                                        offset={coreStop}
                                        stopColor="#fff"
                                        stopOpacity={1}
                                    />
                                    <Stop
                                        offset="100%"
                                        stopColor="#fff"
                                        stopOpacity={0}
                                    />
                                </RadialGradient>
                                <Mask id="meshMask">
                                    <Rect
                                        width={box.width}
                                        height={box.height}
                                        fill="url(#meshFade)"
                                    />
                                </Mask>
                            </Defs>
                            <G mask="url(#meshMask)">{lattice}</G>
                        </>
                    ) : (
                        lattice
                    )}
                </Svg>
            )}
        </View>
    );
}

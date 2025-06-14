import GameMap from "./GameMap";
import GameStart from "./GameStart";
import {TLevel} from "./types";
import {useState} from "react";

export default function GameLandingPage() {
    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState<TLevel | null>(null);

    const startGame = (level: TLevel | null) => {
        if (level !== null) {
            setLevel(level);
        }
        setGameStarted(true);
    };

    const addPoints = (points: number) => {
        setScore((prev) => prev + points);
    };

    if (!gameStarted) {
        return <GameStart onStart={startGame} />;
    }

    return (
        <>
            <GameMap score={score} level={level} onAddPoints={addPoints} />
        </>
    );
}

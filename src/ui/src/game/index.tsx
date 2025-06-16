import GameMap from "./GameMap";
import GameStart from "./GameStart";
import {Helmet} from "react-helmet-async";
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
        return (
            <>
                <Helmet>
                    <title>KuraZetu: pinVerify254 Game</title>
                    <meta
                        name="description"
                        content="Play the KuraZetu pinVerify254 game to help verify polling station data!"
                    />

                    <meta property="og:title" content="KuraZetu Game" />
                    <meta
                        property="og:description"
                        content="Play the KuraZetu pinVerify254 game to help verify polling station data!"
                    />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://kurazetu.com/ui/game/" />
                    <meta
                        property="og:image"
                        content="https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/pinVerify254ogp.png"
                    />
                    <meta
                        property="og:image:alt"
                        content="KuraZetu pinVerify254 game logo"
                    />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta property="og:site_name" content="KuraZetu" />
                    <meta property="og:locale" content="en_US" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="KuraZetu pinVerify254 Game" />
                    <meta
                        name="twitter:description"
                        content="Play the KuraZetu pinVerify254 game to help verify polling station data!"
                    />
                    <meta
                        name="twitter:image"
                        content="https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/pinVerify254ogp.png"
                    />
                    <meta
                        name="twitter:image:alt"
                        content="KuraZetu pinVerify254 game logo"
                    />
                    <meta name="twitter:site" content="@shamash92_" />

                    <meta name="twitter:creator" content="@shamash92_" />
                    <link rel="canonical" href="https://kurazetu.com/ui/game/" />

                    <link
                        rel="icon"
                        href="https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/logo.png"
                        type="image/x-icon"
                    />
                </Helmet>
                <GameStart onStart={startGame} />;
            </>
        );
    }

    return (
        <>
            <GameMap score={score} level={level} onAddPoints={addPoints} />
        </>
    );
}

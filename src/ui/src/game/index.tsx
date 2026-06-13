import GameMap from "./GameMap";
import GameStart from "./GameStart";
import {Helmet} from "react-helmet-async";
import {TLevel} from "./types";
import {useSearchParams} from "react-router-dom";

// Levels we accept from the ?level= query param. "random" is the global,
// no-login track; ward/constituency/county are the logged-in tracks.
const VALID_LEVELS = ["random", "ward", "constituency", "county"] as const;
type TParamLevel = (typeof VALID_LEVELS)[number];

export default function GameLandingPage() {
    // URL param drives the screen so history + reload land back on the same
    // track (e.g. /ui/game/?level=ward).
    const [searchParams, setSearchParams] = useSearchParams();
    const rawLevel = searchParams.get("level");
    const level = VALID_LEVELS.includes(rawLevel as TParamLevel)
        ? (rawLevel as TParamLevel)
        : null;

    const startGame = (chosen: TParamLevel) => {
        setSearchParams({level: chosen});
    };

    // "random" maps to a null admin-level for the existing GameMap/API contract.
    const mapLevel: TLevel | null = level === "random" || level === null ? null : level;

    if (level === null) {
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
            <GameMap level={mapLevel} />
        </>
    );
}

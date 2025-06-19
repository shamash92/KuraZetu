import {GeoJSON, Marker, Popup, Tooltip} from "react-leaflet";
import type {
    IConstituencyBoundary,
    ICountyBoundary,
    IPollingCenterLocation,
    IWardBoundary,
} from "../../types/boundaries";
import L, {LatLng, LatLngBounds} from "leaflet";
import React, {useEffect, useRef, useState} from "react";

import CountiesLoadingScreen from "./LoadingScreen";
import {MapContainer} from "react-leaflet";
import NavComponent from "../../landing-pages/nav";
import {TileLayer} from "react-leaflet";
import {useMap} from "react-leaflet";

function CountySelect() {
    const [activePolygon, setActivePolygon] = useState<number | string | null>(null);
    const [counties, setCounties] = useState<ICountyBoundary[] | null>(null);
    const [constituencies, setConstituencies] = useState<IConstituencyBoundary[]>([]);
    const [wards, setWards] = useState<IWardBoundary[]>([]);
    const [pollingCenters, setPollingCenters] = useState<IPollingCenterLocation[]>([]);

    const [bounds, setBounds] = useState<LatLngBounds | null>(null);
    const [wardBounds, setWardBounds] = useState<LatLngBounds | null>(null);

    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
    const [selectedConstituency, setSelectedConstituency] = useState<number | null>(
        null,
    );
    const [selectedWard, setSelectedWard] = useState<number | null>(null);

    const [selectedPollingCenter, setSelectedPollingCenter] = useState<string | null>(
        null,
    );

    const [pollingCenterErrorMessage, setPollingCenterErrorMessage] = useState<
        string | null
    >(null);

    const [tileLayerProvider, setTileLayerProvider] = useState<
        "Google" | "OpenStreetMap"
    >("OpenStreetMap");

    const handleMapReady = (map) => {
        setMapInstance(map);
    };

    const fetchConstituencies = async () => {
        console.log("getting constituencies data");

        fetch(`/api/stations/county/${activePolygon}/constituencies/boundaries/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data, "constituencies data");
                setConstituencies(data.features);
                try {
                    if (data.features.length > 0) {
                        const mapBounds = L.geoJSON(data.features).getBounds();
                        setBounds(mapBounds.isValid() ? mapBounds : null);
                    }
                } catch {}
            });
    };

    const fetchWards = async () => {
        fetch(`/api/stations/constituencies/${activePolygon}/wards/boundaries/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data, "ward data");
                setWards(data.features);
                try {
                    if (data.features.length > 0) {
                        const mapBounds = L.geoJSON(data.features).getBounds();
                        setBounds(mapBounds.isValid() ? mapBounds : null);
                    }
                } catch {}
            });
    };

    const fetchPollingCenters = async (wardNumber: number) => {
        fetch(`/api/stations/wards/${wardNumber}/polling-centers/pins/`, {
            method: "GET",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data, "polling centers data");
                setPollingCenters(data.features);
            });
    };

    useEffect(() => {
        console.log("useEffect to call counties");

        //  this re-renders if counties is zero
        if (counties === null || counties.length <= 0) {
            fetch("/api/stations/counties/boundaries/", {
                method: "GET",
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log(data, "data");

                    if (data.features.length > 0) {
                        setCounties(data.features);
                    }
                    try {
                        if (data.features.length > 0) {
                            const mapBounds = L.geoJSON(data.features).getBounds();
                            console.log(mapBounds, "mapBounds");
                            console.log(typeof mapBounds, "mapBounds");

                            let x = mapBounds.isValid() ? "valid" : "invalid";
                            console.log(x, "mapBounds is valid");

                            setBounds(mapBounds.isValid() ? mapBounds : null);
                        }
                    } catch (err) {
                        console.log(err, "error");
                    }
                });
        }
    }, [counties]);

    const handlePolygonClick = (name) => {
        setActivePolygon(name);
    };
    // Custom MapComponent that fits the map within the bounds and disables panning beyond the bounds
    const FitBoundsMap = () => {
        const map = useMap();

        useEffect(() => {
            if (bounds && map) {
                map.fitBounds(bounds, {padding: [10, 10]});
            }
        }, [bounds, map]);

        return null;
    };

    const handleCountySelect = async (
        name: number,
        level: "county" | "constituency",
    ) => {
        console.log(name, "name");

        console.log(selectedCounty, "selectedCounty");
        console.log(selectedConstituency, "selectedConstituency");
        console.log(selectedWard, "selectedWard");
        console.log(selectedPollingCenter, "selectedPollingCenter");

        if (
            selectedCounty === null &&
            selectedConstituency === null &&
            selectedWard === null &&
            selectedPollingCenter === null
        ) {
            console.log(`first`);
            setSelectedCounty(name);
            setSelectedConstituency(null);
            setSelectedWard(null);
            setSelectedPollingCenter(null);
            const data = await fetchConstituencies();
        } else if (
            selectedCounty &&
            selectedConstituency === null &&
            selectedWard === null
        ) {
            console.log(`second`);

            setSelectedConstituency(name);
            setSelectedWard(null);
            setSelectedPollingCenter(null);
            const data = await fetchWards();
        } else {
            console.log(`we shouldn't get here`);
        }
    };

    const handleWardSelect = async (ward: IWardBoundary) => {
        console.log(`third`);

        setSelectedWard(ward.properties.number);

        setSelectedPollingCenter(null);
        const data = await fetchPollingCenters(ward.properties.number);

        let geometry = ward.geometry;

        console.log(geometry, "pin location geometry");

        // TODO: Technically we shouldn't have a null geometry or undefined
        if (geometry !== null && geometry !== undefined) {
            console.log("ward is here");

            // get map bounds form the polygon geometry
            const mapBounds = L.geoJSON(geometry).getBounds();

            console.log(mapBounds, "ward mapBounds");

            if (mapBounds.isValid()) {
                console.log("mapBounds is valid");
                setBounds(mapBounds);
                setWardBounds(mapBounds);
            } else {
                setBounds(null);
                setWardBounds(null);
            }
        }
    };

    const handlePollingCenterZoom = async (polling_center: IPollingCenterLocation) => {
        let geometry = polling_center.geometry;
        let errorMessage = polling_center.properties.pin_location_error;
        setPollingCenterErrorMessage(errorMessage);

        console.log(geometry, "pin location geometry");
        if (geometry !== null && geometry.coordinates[0] !== 0) {
            setTileLayerProvider("Google");
            console.log("geometry is here");
            console.log(geometry.coordinates, "geometry coordinates");
            console.log(geometry.coordinates[0], "geometry coordinates 0");
            const latLng = new LatLng(geometry.coordinates[1], geometry.coordinates[0]);

            const mapBounds = L.latLngBounds(latLng, latLng);

            console.log(mapBounds, "mapBounds");
            setBounds(mapBounds.isValid() ? mapBounds : null);

            // console.log(mapInstance, 'mapInstance');

            // mapInstance?.flyTo(latLng, 6);
        } else {
            // This is to reset the zoom and bounds back to the ward if the pin location is not present
            setTileLayerProvider("OpenStreetMap");
            setBounds(wardBounds);
        }
    };

    const handlePollingCenterSelect = async (code: string, level: "polling_center") => {
        console.log(code, "polling station code");

        console.log(`fourth`);

        setSelectedPollingCenter(code);
    };

    if (counties === null || counties.length === 0) {
        return <CountiesLoadingScreen />;
    }

    return (
        <div className="flex flex-col w-full md:h-screen md:flex-row ">
            {activePolygon == null ? (
                <div className="flex flex-col justify-start w-full">
                    <NavComponent />
                    <div className="flex flex-col items-center justify-center w-full min-h-screen px-4 py-8 bg-gradient-to-br from-green-50 to-blue-50">
                        <div className="flex flex-col w-full max-w-xl gap-8">
                            {/* Login Card */}
                            <div className="flex flex-col items-center overflow-hidden transition-shadow duration-300 bg-white shadow-xl md:flex-row rounded-2xl hover:shadow-2xl">
                                <div className="flex items-center justify-center flex-shrink-0 w-full h-40 md:w-1/3 md:h-48 bg-gradient-to-tr from-gray-800 to-gray-600">
                                    <img
                                        src="https://img.icons8.com/ios-filled/100/ffffff/lock-2.png"
                                        alt="Login"
                                        className="w-20 h-20"
                                    />
                                </div>
                                <div className="flex flex-col justify-center w-full p-6 md:w-2/3">
                                    <h2 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">
                                        Already have an account?
                                    </h2>
                                    {/* <p className="mb-4 text-sm text-gray-600 md:text-base">
                                    If you have previously registered, you can log in to
                                    your account to continue.
                                </p> */}
                                    <a
                                        href="/accounts/login/"
                                        className="inline-block px-6 py-2 mt-12 font-semibold text-center text-white transition bg-gray-800 rounded-lg shadow hover:bg-gray-700"
                                    >
                                        Login
                                    </a>
                                </div>
                            </div>
                            {/* Registration Card */}
                            <div className="flex flex-col items-center py-0 overflow-hidden transition-shadow duration-300 bg-white shadow-xl md:flex-row rounded-2xl hover:shadow-2xl">
                                <div className="flex items-center justify-center w-full h-full md:w-1/3 bg-gradient-to-tr from-green-400 to-blue-400">
                                    <img
                                        src="https://img.icons8.com/ios-filled/100/ffffff/add-user-group-man-man.png"
                                        alt="Register"
                                        className="object-contain w-20 h-20"
                                    />
                                </div>
                                <div className="flex flex-col justify-center w-full p-6 md:w-2/3">
                                    <h2 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">
                                        New here?
                                    </h2>
                                    <p className="mb-4 text-sm text-gray-600 md:text-xs lg:text-md ">
                                        Start your registration to join our community
                                        and access all features. It only takes a few
                                        minutes!
                                    </p>
                                    <button
                                        onClick={() => setActivePolygon(0)}
                                        className="inline-block px-6 py-2 font-semibold text-white transition bg-green-500 rounded-lg shadow hover:bg-green-600"
                                    >
                                        Start Registration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : selectedPollingCenter ? (
                <div className="flex flex-col-reverse items-center justify-center w-full h-full bg-gray-100 md:flex-row md:justify-between">
                    {/* Success message and proceed to signup form */}
                    <div className="flex flex-col items-center justify-center w-full md:w-1/2">
                        <h1 className="text-2xl font-extrabold tracking-tight text-center scroll-m-20 lg:text-5xl md:mt-12">
                            You are almost done...
                        </h1>

                        <p>County: {selectedCounty}</p>
                        <p>Constituency: {selectedConstituency}</p>
                        <p>Ward: {selectedWard}</p>
                        <p>Polling Center: {selectedPollingCenter}</p>

                        <p className="mt-8 mb-12 text-center">
                            Proceed below to share your information
                        </p>

                        <a
                            href={`/ui/signup/accounts/${selectedWard}/${selectedPollingCenter}/`}
                            className="flex-row items-center justify-center w-2/3 p-4 px-5 py-3 overflow-hidden font-medium bg-gray-800 rounded-lg shadow-2xl md:w-1/2 group"
                        >
                            <span className="font-bold text-center text-white text-md">
                                Proceed To registration
                            </span>
                        </a>
                    </div>

                    {/* svg */}

                    <div className="flex flex-col items-center justify-start   h-[25vh] md:h-full w-full mt-8 md:justify-center md:w-1/2 md:mt-0">
                        <div className="flex flex-col justify-start w-2/3 h-full shadow md:justify-center rounded-3xl shadow-3xl">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="945.001"
                                height="908.438"
                                viewBox="0 0 945.001 908.438"
                                role="img"
                                className="w-full"
                            >
                                <g
                                    id="Group_104"
                                    data-name="Group 104"
                                    transform="translate(-232 -57.317)"
                                >
                                    <path
                                        id="Path_1648-449"
                                        data-name="Path 1648"
                                        d="M943.9,244.151s-3.74,15.893,0,27.112L927.069,273.6l-14.959-7.479V256.3s7.012-14.959,5.142-32.254Z"
                                        transform="translate(-257.463 56.182) rotate(9)"
                                        fill="#ffb9b9"
                                    />
                                    <path
                                        id="Path_438-450"
                                        data-name="Path 438"
                                        d="M222.885,693.524a24.215,24.215,0,0,0,23.383-4.119c8.19-6.874,10.758-18.2,12.847-28.682l6.18-31.017-12.938,8.908c-9.3,6.406-18.818,13.019-25.26,22.3s-9.252,21.947-4.078,31.988"
                                        transform="translate(104.5 213.612)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        id="Path_439-451"
                                        data-name="Path 439"
                                        d="M224.883,733.235c-1.628-11.864-3.3-23.881-2.159-35.872,1.015-10.649,4.264-21.049,10.878-29.579a49.206,49.206,0,0,1,12.625-11.44c1.262-.8,2.424,1.2,1.167,2a46.779,46.779,0,0,0-18.5,22.326c-4.029,10.246-4.675,21.416-3.982,32.3.419,6.582,1.311,13.121,2.206,19.653a1.2,1.2,0,0,1-.808,1.423,1.164,1.164,0,0,1-1.423-.808Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#f2f2f2"
                                    />
                                    <path
                                        id="Path_442-452"
                                        data-name="Path 442"
                                        d="M236.6,714.2a17.825,17.825,0,0,0,15.531,8.019c7.864-.373,14.418-5.86,20.317-11.07L289.9,695.738l-11.55-.553c-8.306-.4-16.827-.771-24.738,1.793s-15.208,8.726-16.654,16.915"
                                        transform="translate(104.5 213.612)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        id="Path_443-453"
                                        data-name="Path 443"
                                        d="M220.28,740.055c7.84-13.871,16.932-29.288,33.181-34.216a37.028,37.028,0,0,1,13.955-1.441c1.482.128,1.112,2.412-.367,2.284a34.4,34.4,0,0,0-22.272,5.892c-6.28,4.275-11.17,10.218-15.308,16.519-2.535,3.86-4.806,7.884-7.076,11.9C221.667,742.281,219.546,741.354,220.28,740.055Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#f2f2f2"
                                    />
                                    <path
                                        id="Path_442-2-454"
                                        data-name="Path 442"
                                        d="M1008.357,710.039a17.825,17.825,0,0,1-17.065,3.783c-7.508-2.371-12.442-9.35-16.813-15.9l-12.934-19.357,11.308,2.417c8.132,1.738,16.465,3.555,23.458,8.056s12.472,12.323,11.778,20.61"
                                        transform="translate(104.5 213.612)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        id="Path_443-2-455"
                                        data-name="Path 443"
                                        d="M1017.531,739.208c-4.034-15.414-8.885-32.643-23.334-41.559a37.025,37.025,0,0,0-13.124-4.96c-1.465-.255-1.691,2.048-.229,2.3a34.4,34.4,0,0,1,20.026,11.389c4.979,5.738,8.187,12.733,10.578,19.883,1.464,4.38,2.631,8.851,3.8,13.316C1015.62,741.006,1017.908,740.652,1017.531,739.208Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#f2f2f2"
                                    />
                                    <path
                                        id="Path_1686-456"
                                        data-name="Path 1686"
                                        d="M858.659,434.808H594.335c-4.395,0-7.957-.9-7.962-2V410.389c.005-1.1,3.567-2,7.962-2H858.659c4.395,0,7.956.9,7.962,2v22.417c-.005,1.1-3.567,2-7.962,2Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#f1f1f1"
                                    />
                                    <path
                                        id="Path_1689-457"
                                        data-name="Path 1689"
                                        d="M759.012,321.315l-.292-.216-.007-.005a3.576,3.576,0,0,0-5,.739l-59.5,80.106h-6.546V400.4a1.431,1.431,0,0,0-1.431-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.26V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.253V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.26V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.253V400.4a1.431,1.431,0,0,0-1.43-1.431H646.24a1.43,1.43,0,0,0-1.43,1.431v1.538h-2.26V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.26V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538H624.5V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.26V400.4a1.431,1.431,0,0,0-1.43-1.431H610.14a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.253V400.4a1.431,1.431,0,0,0-1.43-1.431h-3.905a1.431,1.431,0,0,0-1.431,1.43v1.538h-2.832a3.576,3.576,0,0,0-3.576,3.576v3.412a3.576,3.576,0,0,0,3.576,3.576H693.62a5.329,5.329,0,0,0,5.218-4.247l.037.027,60.871-81.957.006-.007a3.577,3.577,0,0,0-.739-5Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#090814"
                                    />
                                    <path
                                        id="Path_1690-458"
                                        data-name="Path 1690"
                                        d="M255.5,550.825l20.476,10.186,24.316-45-21.069-11.549Z"
                                        transform="translate(230 371.508)"
                                        fill="#ffb7b7"
                                    />
                                    <path
                                        id="Path_1692-459"
                                        data-name="Path 1692"
                                        d="M394.317,567.652H414l4.611-52.077h-24.3Z"
                                        transform="translate(232 372)"
                                        fill="#ffb7b7"
                                    />
                                    <path
                                        id="Path_1694-460"
                                        data-name="Path 1694"
                                        d="M458.663,301.261s-9.041-6.927-9.041,9.993l-1.428,55.913,15.941,52.82,9.279-17.131-3.807-37.117Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        id="Path_1695-461"
                                        data-name="Path 1695"
                                        d="M555.377,454.192s10.484,51.058-2.8,92.96l-7.339,161.107-26.909-2.1L508.9,586.642l-9.086-59.41L480.94,581.4,418.733,696.027l-28.657-22.366s31.756-86.649,55.217-104.842L457.06,434.808Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#090814"
                                    />
                                    <circle
                                        id="Ellipse_359"
                                        data-name="Ellipse 359"
                                        cx="30.683"
                                        cy="30.683"
                                        r="30.683"
                                        transform="translate(586.34 428.134) rotate(-61.337)"
                                        fill="#ffb7b7"
                                    />
                                    <path
                                        id="Path_1696-462"
                                        data-name="Path 1696"
                                        d="M521.309,208.822c3.678.479,6.453-3.285,7.739-6.763s2.267-7.529,5.465-9.408c4.369-2.567,9.959.52,14.955-.327,5.642-.957,9.311-6.936,9.6-12.651s-1.987-11.212-4.219-16.482l-.779,6.549a12.987,12.987,0,0,0-5.675-11.352l1,9.609a10.2,10.2,0,0,0-11.733-8.439l.158,5.726c-6.517-.775-13.09-1.551-19.626-.961s-13.118,2.658-18.071,6.963c-7.41,6.439-10.116,17.041-9.208,26.815s4.943,18.957,9.149,27.827c1.058,2.232,2.521,4.75,4.975,5.034,2.2.255,4.222-1.587,4.907-3.7a13.4,13.4,0,0,0-.06-6.585c-.62-3.295-1.4-6.662-.819-9.963s2.958-6.564,6.286-6.968,6.733,3.4,5.133,6.345Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#090814"
                                    />
                                    <path
                                        id="Path_1697-463"
                                        data-name="Path 1697"
                                        d="M429.776,309.458,327.357,302.85l7.709-31.937,93.608,20.925Z"
                                        transform="translate(232 372)"
                                        fill="#d6d6e3"
                                    />
                                    <path
                                        id="Path_1698-464"
                                        data-name="Path 1698"
                                        d="M494.114,244.158l6.424-8.919s7.18,2.44,26.41,12.012l1.359,8.356,33.379,205.3-60.671-2.617-16.522-.352-5.407-12.12-6.667,11.863-16.134-.343-16.417-9.517,16.179-49.489,5.234-45.206-8.09-42.589s-10.179-39.108,29.027-60.2Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        id="Path_1699-465"
                                        data-name="Path 1699"
                                        d="M630.863,399.573a10.486,10.486,0,0,1-13.041-9.406l-36-9.641,14.48-12.857L628.268,378.8a10.543,10.543,0,0,1,2.595,20.777Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#ffb7b7"
                                    />
                                    <path
                                        id="Path_1700-466"
                                        data-name="Path 1700"
                                        d="M614.741,394.13a6.142,6.142,0,0,1-4.987.4l-59.213-22.474a63.227,63.227,0,0,1-34.032-28.684l-24.693-44.049A19.765,19.765,0,1,1,521.307,273l42.74,67.742,53.787,31.534a6.155,6.155,0,0,1,2.618,6.546l-2.675,11.334a6.143,6.143,0,0,1-1.866,3.15,6.078,6.078,0,0,1-1.169.828Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        id="Path_1701-467"
                                        data-name="Path 1701"
                                        d="M1071.5,741.388h-943a1,1,0,0,1,0-2h943a1,1,0,0,1,0,2Z"
                                        transform="translate(104.5 213.612)"
                                        fill="#cbcbcb"
                                    />
                                    <path
                                        id="Path_1718-468"
                                        data-name="Path 1718"
                                        d="M1077.069,514.354H634.892V239.069h442.178ZM645.18,504.066h421.6V249.358H645.18Z"
                                        transform="translate(99.932 -69.755)"
                                        fill="#e5e5e5"
                                    />
                                    <rect
                                        id="Rectangle_408"
                                        data-name="Rectangle 408"
                                        width="431.889"
                                        height="264.996"
                                        transform="translate(739.967 174.458)"
                                        fill="#fff"
                                    />
                                    <path
                                        id="Path_1719-469"
                                        data-name="Path 1719"
                                        d="M1070.872,310.322V294.052h-59.913V243.16H994.688v50.891H888.025V243.16H871.754v50.891H707.239V243.16H690.968v50.891H638.983v16.271h51.985V373.6H638.983v16.271h51.985v67.795H638.983v16.271H778.649v34.223h16.27V473.934h76.834v34.223h16.271V473.934h182.847V457.663H888.025V389.868h182.847V373.6h-59.913V310.322Zm-199.118,0v19.886H707.239V310.322ZM707.239,346.48H871.754V373.6H707.239Zm0,111.183V389.868h71.411v67.795Zm164.515,0H794.92V389.868h76.834ZM994.688,373.6H888.025V310.322H994.688Z"
                                        transform="translate(100.984 -68.703)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        id="Path_1720-470"
                                        data-name="Path 1720"
                                        d="M924.941,228.019c0,43.089-78.019,139.077-78.019,139.077S768.9,271.107,768.9,228.019a78.019,78.019,0,0,1,156.038,0Z"
                                        transform="translate(134.428 -92.683)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        id="Path_1721-471"
                                        data-name="Path 1721"
                                        d="M873.918,216.651a35.666,35.666,0,1,1-35.666-35.666A35.666,35.666,0,0,1,873.918,216.651Z"
                                        transform="translate(143.098 -84.707)"
                                        fill="#fff"
                                    />
                                    <ellipse
                                        id="Ellipse_361"
                                        data-name="Ellipse 361"
                                        cx="21.031"
                                        cy="21.031"
                                        rx="21.031"
                                        ry="21.031"
                                        transform="translate(960.316 288.66)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        id="Path_1400-472"
                                        data-name="Path 1400"
                                        d="M308.718,792.282,331.3,803.836s35.341,8.425,12.331,15.426-33.368,2.025-33.368,2.025-30.1,1.565-29.615-6.833,6.276-20.207,6.276-20.207S307.069,799.511,308.718,792.282Z"
                                        transform="translate(337.588 142.754)"
                                        fill="#090814"
                                    />
                                    <path
                                        id="Path_1745-473"
                                        data-name="Path 1745"
                                        d="M310.456,793.309,331.3,803.836s35.341,8.425,12.331,15.426-33.368,2.025-33.368,2.025-30.1,1.565-29.615-6.833,6.276-20.207,6.276-20.207S308.806,800.538,310.456,793.309Z"
                                        transform="translate(430.732 76.229) rotate(16)"
                                        fill="#090814"
                                    />
                                    <path
                                        id="Path_1746-474"
                                        data-name="Path 1746"
                                        d="M882.754,434.808H595.039c-4.784,0-8.661-.9-8.666-2V410.389c.005-1.1,3.882-2,8.666-2H882.754c4.784,0,8.661.9,8.666,2v22.417c-.005,1.1-3.882,2-8.666,2Z"
                                        transform="translate(1252.598 58.976) rotate(90)"
                                        fill="#f1f1f1"
                                    />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col-reverse justify-start w-full md:flex-row md:justify-between">
                    {/* List */}
                    <div className="flex flex-col items-center justify-center w-full bg-[#f3efe9] md:h-full h-[50vh] md:w-4/12 ">
                        <div className="flex-col justify-center w-full px-8 py-4 text-center ">
                            <h2 className="text-xl font-bold text-center text-gray-900 md:text-2xl">
                                Select your home{" "}
                                <span className="text-green-500">
                                    {selectedWard
                                        ? "Polling Center"
                                        : selectedConstituency
                                        ? "Ward"
                                        : selectedCounty
                                        ? "Constituency"
                                        : "County"}
                                </span>
                            </h2>
                        </div>
                        <div className="flex w-full p-4 pb-4 overflow-y-scroll bg-gray-100 md:w-10/12 rounded-lg md:h-[80vh] h-[50vh] ring-2 ring-gray-300 shadow-md">
                            <div className="w-full h-auto pb-6 ">
                                {counties !== null &&
                                counties.length > 0 &&
                                constituencies.length <= 0
                                    ? counties.map((county) => (
                                          <a
                                              key={county.id}
                                              className={`flex flex-row items-center justify-between my-2 bg-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-50 transition duration-200 ${
                                                  activePolygon ===
                                                  county.properties.number
                                                      ? "border-2 border-blue-500"
                                                      : "border border-gray-300"
                                              }`}
                                              onClick={() =>
                                                  handlePolygonClick(
                                                      county.properties.number,
                                                  )
                                              }
                                          >
                                              <p className="font-semibold tracking-wide text-gray-800">
                                                  {county.properties.name}
                                              </p>

                                              {activePolygon ===
                                              county.properties.number ? (
                                                  <button
                                                      className="flex flex-row items-center px-3 py-1 text-white transition duration-200 bg-blue-500 rounded-full shadow hover:bg-blue-600"
                                                      onClick={() =>
                                                          handleCountySelect(
                                                              activePolygon,
                                                              "county",
                                                          )
                                                      }
                                                  >
                                                      <p className="pr-2">Select</p>
                                                      <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          fill="none"
                                                          viewBox="0 0 24 24"
                                                          strokeWidth="1.5"
                                                          stroke="currentColor"
                                                          className="w-5 h-5"
                                                      >
                                                          <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                          />
                                                      </svg>
                                                  </button>
                                              ) : (
                                                  ""
                                              )}
                                          </a>
                                      ))
                                    : wards.length <= 0 && constituencies.length > 0
                                    ? constituencies.map((constituency) => (
                                          <a
                                              key={constituency.id}
                                              className={` flex flex-row items-center justify-between my-2 bg-gray-50 py-2 pl-2 rounded-md text-blue-600 ${
                                                  activePolygon ===
                                                  constituency.properties.number
                                                      ? "active"
                                                      : ""
                                              }`}
                                              onClick={() =>
                                                  handlePolygonClick(
                                                      constituency.properties.number,
                                                  )
                                              }
                                          >
                                              <p className="font-semibold tracking-wider">
                                                  {constituency.properties.name}
                                              </p>

                                              {activePolygon ===
                                              constituency.properties.number ? (
                                                  <button
                                                      className="flex flex-row px-2 bg-blue-200 rounded-full ring-2"
                                                      onClick={() =>
                                                          handleCountySelect(
                                                              activePolygon,
                                                              "constituency",
                                                          )
                                                      }
                                                  >
                                                      <p className="pr-2">Select</p>
                                                      <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          fill="none"
                                                          viewBox="0 0 24 24"
                                                          strokeWidth="1.5"
                                                          stroke="currentColor"
                                                          className="w-6 h-6"
                                                      >
                                                          <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                          />
                                                      </svg>
                                                  </button>
                                              ) : (
                                                  ""
                                              )}
                                          </a>
                                      ))
                                    : pollingCenters.length <= 0 && wards.length > 0
                                    ? wards.map((ward) => (
                                          <a
                                              key={ward.id}
                                              className={` flex flex-row items-center justify-between my-2 bg-gray-50 py-2 pl-2 rounded-md text-blue-600 ${
                                                  activePolygon ===
                                                  ward.properties.number
                                                      ? "active"
                                                      : ""
                                              }`}
                                              onClick={() =>
                                                  handlePolygonClick(
                                                      ward.properties.number,
                                                  )
                                              }
                                          >
                                              <p className="font-semibold tracking-wider">
                                                  {ward.properties.name}
                                              </p>

                                              {activePolygon ===
                                              ward.properties.number ? (
                                                  <button
                                                      className="flex flex-row px-2 bg-blue-200 rounded-full ring-2"
                                                      onClick={() =>
                                                          // handleCountySelect(activePolygon, 'ward')

                                                          handleWardSelect(ward)
                                                      }
                                                  >
                                                      <p className="pr-2">Select</p>
                                                      <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          fill="none"
                                                          viewBox="0 0 24 24"
                                                          strokeWidth="1.5"
                                                          stroke="currentColor"
                                                          className="w-6 h-6"
                                                      >
                                                          <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                          />
                                                      </svg>
                                                  </button>
                                              ) : (
                                                  ""
                                              )}
                                          </a>
                                      ))
                                    : pollingCenters.length > 0 &&
                                      pollingCenters.map((pollingCenter) => (
                                          <a
                                              key={pollingCenter.id}
                                              className={` flex flex-row items-center justify-between my-2 bg-gray-50 py-2 pl-2 rounded-md text-blue-600 ${
                                                  activePolygon ===
                                                  pollingCenter.properties.code
                                                      ? "active"
                                                      : ""
                                              }`}
                                              onClick={() => {
                                                  handlePolygonClick(
                                                      pollingCenter.properties.code,
                                                  );
                                                  handlePollingCenterZoom(
                                                      pollingCenter,
                                                  );
                                              }}
                                          >
                                              <p className="font-semibold tracking-wider">
                                                  {pollingCenter.properties.name}
                                              </p>

                                              {activePolygon ===
                                              pollingCenter.properties.code ? (
                                                  <button
                                                      className="flex flex-row px-2 bg-blue-200 rounded-full ring-2"
                                                      onClick={() =>
                                                          // handleCountySelect(activePolygon, 'pollingCenter')
                                                          handlePollingCenterSelect(
                                                              activePolygon,
                                                              "polling_center",
                                                          )
                                                      }
                                                  >
                                                      <p className="pr-2">Select</p>
                                                      <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          fill="none"
                                                          viewBox="0 0 24 24"
                                                          strokeWidth="1.5"
                                                          stroke="currentColor"
                                                          className="w-6 h-6"
                                                      >
                                                          <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                          />
                                                      </svg>
                                                  </button>
                                              ) : (
                                                  ""
                                              )}
                                          </a>
                                      ))}
                            </div>
                        </div>
                    </div>
                    {/* Map Container */}
                    <div className="z-0 flex w-full md:w-8/12 h-[50vh] md:h-full">
                        {bounds ? (
                            <MapContainer
                                center={[0, 37]}
                                zoom={7}
                                style={{height: "100%", width: "100%"}}
                                bounds={bounds}
                                maxBounds={bounds}
                                whenReady={() => handleMapReady(mapInstance)}
                            >
                                <FitBoundsMap />

                                {tileLayerProvider === "Google" ? (
                                    <TileLayer
                                        url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                                    />
                                ) : (
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                )}

                                {counties.length > 0 &&
                                selectedCounty === null &&
                                selectedConstituency === null &&
                                selectedWard === null
                                    ? counties.map((county) => (
                                          <GeoJSON
                                              key={county.id}
                                              data={county}
                                              style={() => ({
                                                  fillColor:
                                                      activePolygon ===
                                                      county.properties.number
                                                          ? "blue"
                                                          : "gray",
                                                  fillOpacity: 0.5,
                                                  color: "black",
                                                  weight: 1,
                                              })}
                                          />
                                      ))
                                    : null}

                                {constituencies &&
                                    selectedCounty !== null &&
                                    selectedConstituency === null &&
                                    constituencies.map((constituency) => (
                                        <GeoJSON
                                            key={constituency.id}
                                            data={constituency}
                                            style={() => ({
                                                fillColor:
                                                    activePolygon ===
                                                    constituency.properties.number
                                                        ? "blue"
                                                        : "gray",
                                                fillOpacity: 0.5,
                                                color: "black",
                                                weight: 1,
                                            })}
                                            onEachFeature={(feature, layer) => {
                                                console.log("layer", layer);

                                                layer
                                                    .bindPopup(
                                                        `<p> ${feature.properties.name}</p>`,
                                                    )
                                                    .openPopup();
                                            }}
                                        />
                                    ))}
                                {wards &&
                                    selectedConstituency !== null &&
                                    selectedCounty !== null &&
                                    selectedPollingCenter === null &&
                                    wards.map((ward) => (
                                        <GeoJSON
                                            key={ward.id}
                                            data={ward}
                                            style={() => ({
                                                fillColor:
                                                    activePolygon ===
                                                    ward.properties.number
                                                        ? "blue"
                                                        : "gray",
                                                fillOpacity: 0.5,
                                                color: "black",
                                                weight: 1,
                                            })}
                                        />
                                    ))}
                                {pollingCenters &&
                                    selectedWard !== null &&
                                    selectedConstituency !== null &&
                                    selectedCounty !== null &&
                                    pollingCenters.map((pollingCenter) => {
                                        return pollingCenter.geometry !== null ? (
                                            <Marker
                                                key={pollingCenter.id}
                                                position={[
                                                    pollingCenter.geometry
                                                        .coordinates[1],
                                                    pollingCenter.geometry
                                                        .coordinates[0],
                                                ]}
                                                icon={L.icon({
                                                    iconUrl: pollingCenter.properties
                                                        .is_verified
                                                        ? "/static/pins/verified.png" // Green icon for verified TODO: This may fail in prod if we are hosting on AWS
                                                        : pollingCenter.properties
                                                              .pin_location_error
                                                        ? "https://cdn-icons-png.flaticon.com/512/684/684908.png" // Red icon for errors
                                                        : "/static/pins/unverified.png", // Black icon for unverified without errors
                                                    iconSize: [25, 25], // Size of the icon
                                                    iconAnchor: [12, 41], // Anchor point of the icon
                                                    popupAnchor: [0, -41], // Position of the popup relative to the icon
                                                })}
                                                eventHandlers={{
                                                    click: () => {
                                                        handlePolygonClick(
                                                            pollingCenter.properties
                                                                .code,
                                                        );
                                                    },
                                                }}
                                            >
                                                <Popup>
                                                    <p>
                                                        {pollingCenter.properties.name}
                                                    </p>
                                                    <p>
                                                        {pollingCenter.properties.code}
                                                    </p>
                                                </Popup>

                                                {tileLayerProvider === "Google" && (
                                                    <Tooltip permanent>
                                                        <p className="text-xs text-gray-700 ">
                                                            {
                                                                pollingCenter.properties
                                                                    .name
                                                            }
                                                        </p>
                                                    </Tooltip>
                                                )}
                                            </Marker>
                                        ) : null;
                                    })}

                                {pollingCenterErrorMessage && (
                                    <div className=" absolute z-[99999] p-4 w-1/2 text-white bg-red-500 rounded shadow-lg top-4 left-12">
                                        <p>{pollingCenterErrorMessage}</p>
                                    </div>
                                )}
                            </MapContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-2xl">loading map ...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CountySelect;

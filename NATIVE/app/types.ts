export interface ICountyFeature {
    id: number;
    type: "Feature";
    geometry: {
        type: "Polygon";
        coordinates: [number, number][][];
    };
    properties: {
        number: number;
        name: string;
    };
}

export interface ICountyFeatureCollection {
    type: "FeatureCollection";
    features: ICountyFeature[];
}

export default {};

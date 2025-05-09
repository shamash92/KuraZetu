export interface ICountyBoundary {
  id: number;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: {
    number: number;
    name: string;
  };
}

export interface IConstituencyBoundary {
  id: number;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: {
    name: string;
    number: number;
  };
}

export interface IWardBoundary {
  id: number;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: {
    name: string;
    number: number;
  };
}

export interface IPinLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface IPollingCenterLocation {
  id: number;
  type: 'Feature';
  geometry: IPinLocation | null;
  properties: {
    name: string;
    code: string;
    ward: number;
    pin_location_error: string | null;
    is_verified: boolean;
  };
}

export type RouteType = 'FAST' | 'ECO' | 'BALANCED';
export type AvailabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type TransportMode = 'CAR' | 'BUS' | 'SUBWAY' | 'BIKE' | 'WALK';

export type EventResponse = {
  id: number;
  title: string;
  category: string;
  venueName: string;
  latitude: number;
  longitude: number;
  eventDate: string; // yyyy-mm-dd
  sourceUrl?: string | null;
};

export type RouteOptionResponse = {
  routeAlternativeId: number;
  routeType: RouteType;
  durationMinutes: number;
  transferCount: number;
  distanceKm: number;
  carbonKg: number;
  includesBike: boolean;
};

export type RouteCompareResponse = {
  routes: RouteOptionResponse[];
};

export type ReturnAvailabilityResponse = {
  stationId: string;
  targetTime: string;
  level: AvailabilityLevel;
  score: number;
};

export type BikeStationResponse = {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  totalRacks: number;
};

export type CarbonCalculateResponse = {
  routeCarbonKg: number;
  savedCarbonKgVsCar: number;
};


export interface TechRadarData {
  title: string;
  quadrants: Quadrant[];
  rings: Ring[];
  entries: Entry[];
}

export interface Quadrant {
  id: string;
  name: string;
  expanded?: boolean;
}

export interface Ring {
  id: string;
  name: string;
  color: string;
  description?: string;
  expanded?: boolean;
}

export interface Entry {
  id: string;
  title: string;
  description?: string;
  key: string;
  url?: string;
  quadrant: string;
  timeline: TimelineEntry[];
  expanded?: boolean;
}

export interface TimelineEntry {
  id: string;
  moved: number; // -1, 0, 1
  ringId: string;
  date: string; // format YYYY-MM-dd
  description: string;
  expanded?: boolean;
}

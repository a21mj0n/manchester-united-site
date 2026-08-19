export type Position = "GK" | "DF" | "MF" | "FW";

export interface Player {
  id: number;
  num: number;
  name: string;
  pos: Position;
  posName: string;
  country: string;
}

export interface Fixture {
  id: number;
  date: string;
  time: string;
  home: string;
  away: string;
  comp: string;
  venue: string;
}

export interface Result {
  id: number;
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  comp: string;
}

export interface Standing {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  points: number;
  isUnited?: boolean;
}

export interface TimelineItem {
  year: string;
  title: string;
  text: string;
}

export interface Legend {
  init: string;
  name: string;
  role: string;
  text: string;
}

export interface JoinRequest {
  name: string;
  city: string;
  contact: string;
  since?: number;
}

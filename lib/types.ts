export type Position = "GK" | "DF" | "MF" | "FW";

export interface Player {
  id: number;
  num: number;
  name: string;
  pos: Position;
  posName: string;
  /** Demo ma'lumotda bor, API dan kelganda bo'lmaydi */
  country?: string;
  /** API-Football dan keladi */
  age?: number;
  photo?: string;
  /** Akademiya yoki zaxira o'yinchisi (hisoblanadi, API bermaydi) */
  isAcademy?: boolean;
}

export interface Fixture {
  id: number;
  date: string;
  time: string;
  home: string;
  away: string;
  comp: string;
  venue: string;
  homeBadge?: string | null;
  awayBadge?: string | null;
}

export interface Result {
  id: number;
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  comp: string;
  homeBadge?: string | null;
  awayBadge?: string | null;
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
  badge?: string | null;
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

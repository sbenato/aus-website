import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      wcaId?: string | null;
      countryIso2?: string;
      delegateStatus?: string | null;
      wcaInternalId?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    wcaId?: string | null;
    countryIso2?: string;
    delegateStatus?: string | null;
    wcaInternalId?: number;
  }
}

// ── WCA API Types ─────────────────────────────────────────────────────────────

export interface WCAAvatar {
  id: number;
  url: string;
  thumb_url: string;
  is_default: boolean;
  status: string;
}

export interface WCACountry {
  id: string;
  name: string;
  continent_id: string;
  iso2: string;
}

export interface WCAUser {
  id: number;
  wca_id: string | null;
  name: string;
  gender: string;
  country_iso2: string;
  delegate_status: string | null;
  url: string;
  email?: string;
  avatar: WCAAvatar;
  teams: Array<{ friendly_id: string; leader: boolean }>;
  country: WCACountry;
  class: "user";
  created_at: string;
  updated_at: string;
}

export interface WCACompetition {
  id: string;
  name: string;
  short_name: string;
  short_display_name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  registration_open: string | null;
  registration_close: string | null;
  announced_at: string;
  cancelled_at: string | null;
  results_posted_at: string | null;
  competitor_limit: number | null;
  url: string;
  website: string | null;
  venue: string;
  venue_address: string;
  venue_details: string;
  latitude_degrees: number;
  longitude_degrees: number;
  event_ids: string[];
  delegates: WCAUser[];
  organizers: WCAUser[];
  class: "competition";
}

export interface WCAPersonalBest {
  event_id: string;
  best: number;
  world_rank: number;
  continent_rank: number;
  country_rank: number;
  type: "single" | "average";
}

export interface WCAPersonalRecords {
  [eventId: string]: {
    single?: WCAPersonalBest;
    average?: WCAPersonalBest;
  };
}

export interface WCAPerson {
  person: WCAUser;
  competition_count: number;
  total_solves?: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  records: {
    national: number;
    continental: number;
    world: number;
    total: number;
  };
  personal_records?: WCAPersonalRecords;
}

export type CompetitionStatus =
  | "upcoming"
  | "registration_open"
  | "in_progress"
  | "past"
  | "cancelled";

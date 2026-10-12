// Formas reales de la API Django (`/api/v1/`). Ver `Mobile/openapi_movil.yaml`.

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  roles: Array<{ key: string; name: string }>;
  member_id: number | null;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  token_type: "Bearer";
  expires_in: number;
  user: AuthUser;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Envoltura de `common.exceptions.api_exception_handler`. */
export interface ApiErrorBody {
  error: { code: string; detail: unknown };
}

export type VotingStatus = "draft" | "scheduled" | "open" | "closed";

export interface VotingSubject {
  type: "project" | "agreement";
  id: number;
  title: string;
  summary: string;
  background: string;
  status: string;
}

export interface Voting {
  id: number;
  title: string;
  description: string;
  status: VotingStatus;
  options: string[];
  opens_at: string | null;
  closes_at: string | null;
  member_has_voted: boolean;
  subject: VotingSubject | null;
}

export interface CastVoteResponse {
  status: "recorded";
  cast_at: string;
}

export interface VotingResults {
  voting_id: number;
  status: VotingStatus;
  total_votes: number;
  results: Record<string, number>;
  percentages: Record<string, number>;
}

import { apiRequest } from "./client";
import type { ParticipatingEntity, SiteSection } from "../types/admin";

export interface LandingContentData {
  site_sections?: SiteSection[];
  members?: Array<{
    name: string;
    email?: string;
    role?: "comision" | "editor";
    position?: string;
    org?: string;
    status?: string;
    initials?: string;
    joined?: string;
    photo?: string;
  }>;
  entities?: ParticipatingEntity[];
  custom_positions?: string[];
}

interface LandingContentResponse {
  content: LandingContentData;
  updated_at: string | null;
}

export async function getPublicLandingContent(): Promise<LandingContentResponse> {
  return apiRequest<LandingContentResponse>("/public/landing-content/");
}

export async function getAdminLandingContent(): Promise<LandingContentResponse> {
  return apiRequest<LandingContentResponse>("/landing-content/");
}

export async function saveLandingContent(content: LandingContentData): Promise<LandingContentResponse> {
  return apiRequest<LandingContentResponse>("/landing-content/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

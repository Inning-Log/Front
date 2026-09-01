import { apiClient } from "./apiClient";
import type { TeamSummaryResponse } from "../types/team";

export function getTeams() {
  return apiClient<TeamSummaryResponse[]>("/teams", {
    auth: false,
  });
}

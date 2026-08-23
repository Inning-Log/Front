export type TeamSummaryResponse = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  displayOrder: number;
};

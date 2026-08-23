export type TeamSummaryResponse = {
  id: number;
  teamCode: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  displayOrder: number;
};

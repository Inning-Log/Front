export type MyPageResponse = {
  id: number;
  nickname: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  favoriteTeam: {
    id: number;
    teamCode: string;
    name: string;
    shortName: string;
    logoUrl: string;
    primaryColor: string;
    displayOrder: number;
  };
};

export async function getMyPage(): Promise<MyPageResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch("/api/mypage", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("마이페이지 정보를 불러오지 못했습니다.");
  }

  return response.json();
}
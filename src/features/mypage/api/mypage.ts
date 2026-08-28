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

export type UsernameAvailabilityResponse = {
  username: string;
  available: boolean;
};

function getAuthorizationHeader() {
  const accessToken = localStorage.getItem("accessToken");

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getMyPage(): Promise<MyPageResponse> {
  const response = await fetch("/api/mypage", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("마이페이지 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailabilityResponse> {
  const response = await fetch(
    `/api/mypage/username-availability?username=${encodeURIComponent(
      username,
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthorizationHeader(),
      },
    },
  );

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(
        "아이디 형식 또는 길이가 올바르지 않습니다.",
      );
    }

    if (response.status === 401) {
      throw new Error("로그인이 필요합니다.");
    }

    if (response.status === 404) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    throw new Error("아이디 중복 확인에 실패했습니다.");
  }

  return response.json();
}
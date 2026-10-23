import { apiClient } from "../../../shared/api/apiClient";

import type {
  CreateInningRecordRequest,
  InningRecordResponse,
  UpdateInningRecordRequest,
} from "../types/inningRecord";

//이닝 기록 등록

export function createInningRecord(
  request: CreateInningRecordRequest,
) {
  return apiClient<InningRecordResponse>(
    "/inning-records",
    {
      method: "POST",
      body: request,
      fallbackErrorMessage:
        "이닝 기록을 저장하지 못했습니다.",
    },
  );
}

//이닝 기록 상세 조회
 
export function getInningRecord(
  id: number,
) {
  return apiClient<InningRecordResponse>(
    `/inning-records/${id}`,
    {
      method: "GET",
      fallbackErrorMessage:
        "이닝 기록을 불러오지 못했습니다.",
    },
  );
}

// 내 이닝 기록 문구 수정

export function updateInningRecord(
  id: number,
  request: UpdateInningRecordRequest,
) {
  return apiClient<InningRecordResponse>(
    `/inning-records/${id}`,
    {
      method: "PATCH",
      body: request,
      fallbackErrorMessage:
        "이닝 기록을 수정하지 못했습니다.",
    },
  );
}

//내 이닝 기록 삭제

export function deleteInningRecord(
  id: number,
) {
  return apiClient<void>(
    `/inning-records/${id}`,
    {
      method: "DELETE",
      fallbackErrorMessage:
        "이닝 기록을 삭제하지 못했습니다.",
    },
  );
}
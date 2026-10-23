import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import defaultProfileIcon from "../../../assets/icons/defaultprofile.svg";
import moreVerticalIcon from "../../../assets/icons/more_information.png";

import {
  createVideoComment,
  deleteVideoComment,
  getVideoComments,
  updateVideoComment,
} from "../api/videoCommentApi";

import type {
  VideoComment,
} from "../types/videoComment";

type VideoCommentSheetProps = {
  isOpen: boolean;
  videoId: number | null;
  onClose: () => void;
};

function formatCommentTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (
    difference <
    minute
  ) {
    return "방금";
  }

  if (
    difference <
    hour
  ) {
    return `${Math.floor(
      difference /
        minute,
    )}분 전`;
  }

  if (
    difference <
    day
  ) {
    return `${Math.floor(
      difference /
        hour,
    )}시간 전`;
  }

  return date.toLocaleDateString(
    "ko-KR",
    {
      month:
        "numeric",
      day:
        "numeric",
    },
  );
}

export function VideoCommentSheet({
  isOpen,
  videoId,
  onClose,
}: VideoCommentSheetProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const clientCommentIdRef =
    useRef<string | null>(
      null,
    );

  const [
    comments,
    setComments,
  ] =
    useState<
      VideoComment[]
    >([]);

  const [
    totalCount,
    setTotalCount,
  ] =
    useState(0);

  const [
    nextCursor,
    setNextCursor,
  ] =
    useState<
      string | null
    >(null);

  const [
    hasNext,
    setHasNext,
  ] =
    useState(false);

  const [
    inputValue,
    setInputValue,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    openMenuId,
    setOpenMenuId,
  ] =
    useState<
      number | null
    >(null);

  const [
    editingCommentId,
    setEditingCommentId,
  ] =
    useState<
      number | null
    >(null);

  const [
    editingText,
    setEditingText,
  ] =
    useState("");

  const [
    isUpdating,
    setIsUpdating,
  ] =
    useState(false);

  const [
    deletingCommentId,
    setDeletingCommentId,
  ] =
    useState<
      number | null
    >(null);

  /*
   * 댓글 목록 조회
   */
  useEffect(() => {
    if (
      !isOpen ||
      !videoId
    ) {
      return;
    }

    let cancelled =
      false;

    const loadComments =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setErrorMessage(
            "",
          );

          const response =
            await getVideoComments(
              videoId,
              {
                size: 20,
              },
            );

          if (
            cancelled
          ) {
            return;
          }

          setComments(
            response.items,
          );

          setTotalCount(
            response.totalCount,
          );

          setNextCursor(
            response.nextCursor,
          );

          setHasNext(
            response.hasNext,
          );
        } catch (error) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "댓글 목록 조회 실패:",
            error,
          );

          setErrorMessage(
            error instanceof
                Error
              ? error.message
              : "댓글을 불러오지 못했습니다.",
          );
        } finally {
          if (
            !cancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void loadComments();

    return () => {
      cancelled =
        true;
    };
  }, [
    isOpen,
    videoId,
  ]);

  /*
   * 바텀시트가 닫힐 때 상태 초기화
   */
  useEffect(() => {
    if (isOpen) {
      return;
    }

    setComments(
      [],
    );

    setTotalCount(
      0,
    );

    setNextCursor(
      null,
    );

    setHasNext(
      false,
    );

    setInputValue(
      "",
    );

    setErrorMessage(
      "",
    );

    setOpenMenuId(
      null,
    );

    setEditingCommentId(
      null,
    );

    setEditingText(
      "",
    );

    clientCommentIdRef.current =
      null;
  }, [
    isOpen,
  ]);

  /*
   * 스크롤 잠금 + ESC
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event:
        KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isOpen,
    onClose,
  ]);

  const handleLoadMore =
    async () => {
      if (
        !videoId ||
        !nextCursor ||
        !hasNext ||
        isLoadingMore
      ) {
        return;
      }

      try {
        setIsLoadingMore(
          true,
        );

        const response =
          await getVideoComments(
            videoId,
            {
              cursor:
                nextCursor,

              size: 20,
            },
          );

        setComments(
          (previous) => [
            ...previous,
            ...response.items,
          ],
        );

        setNextCursor(
          response.nextCursor,
        );

        setHasNext(
          response.hasNext,
        );
      } catch (error) {
        console.error(
          "추가 댓글 조회 실패:",
          error,
        );

        setErrorMessage(
          error instanceof
              Error
            ? error.message
            : "댓글을 더 불러오지 못했습니다.",
        );
      } finally {
        setIsLoadingMore(
          false,
        );
      }
    };

  /*
   * 댓글 작성
   */
  const handleSubmit =
    async () => {
      const content =
        inputValue.trim();

      if (
        !videoId ||
        !content ||
        isSubmitting
      ) {
        return;
      }

      try {
        setIsSubmitting(
          true,
        );

        setErrorMessage(
          "",
        );

        const clientCommentId =
          clientCommentIdRef
            .current ??
          crypto.randomUUID();

        clientCommentIdRef.current =
          clientCommentId;

        const created =
          await createVideoComment(
            videoId,
            {
              clientCommentId,
              content,
            },
          );

        setComments(
          (previous) => [
            ...previous,
            created,
          ],
        );

        setTotalCount(
          (previous) =>
            previous + 1,
        );

        setInputValue(
          "",
        );

        clientCommentIdRef.current =
          null;

        inputRef.current?.focus();
      } catch (error) {
        console.error(
          "댓글 작성 실패:",
          error,
        );

        setErrorMessage(
          error instanceof
              Error
            ? error.message
            : "댓글을 작성하지 못했습니다.",
        );
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };

  /*
   * 수정 모드 시작
   */
  const handleStartEdit =
    (
      comment:
        VideoComment,
    ) => {
      setOpenMenuId(
        null,
      );

      setEditingCommentId(
        comment.id,
      );

      setEditingText(
        comment.content,
      );
    };

  /*
   * 댓글 수정
   */
  const handleUpdate =
    async () => {
      if (
        editingCommentId ===
          null ||
        !editingText.trim() ||
        isUpdating
      ) {
        return;
      }

      try {
        setIsUpdating(
          true,
        );

        setErrorMessage(
          "",
        );

        const updated =
          await updateVideoComment(
            editingCommentId,
            {
              content:
                editingText.trim(),
            },
          );

        setComments(
          (previous) =>
            previous.map(
              (comment) =>
                comment.id ===
                updated.id
                  ? updated
                  : comment,
            ),
        );

        setEditingCommentId(
          null,
        );

        setEditingText(
          "",
        );
      } catch (error) {
        console.error(
          "댓글 수정 실패:",
          error,
        );

        setErrorMessage(
          error instanceof
              Error
            ? error.message
            : "댓글을 수정하지 못했습니다.",
        );
      } finally {
        setIsUpdating(
          false,
        );
      }
    };

  /*
   * 댓글 삭제
   */
  const handleDelete =
    async (
      commentId: number,
    ) => {
      if (
        deletingCommentId !==
        null
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "댓글을 삭제하시겠습니까?",
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingCommentId(
          commentId,
        );

        setOpenMenuId(
          null,
        );

        setErrorMessage(
          "",
        );

        await deleteVideoComment(
          commentId,
        );

        setComments(
          (previous) =>
            previous.filter(
              (comment) =>
                comment.id !==
                commentId,
            ),
        );

        setTotalCount(
          (previous) =>
            Math.max(
              0,
              previous - 1,
            ),
        );
      } catch (error) {
        console.error(
          "댓글 삭제 실패:",
          error,
        );

        setErrorMessage(
          error instanceof
              Error
            ? error.message
            : "댓글을 삭제하지 못했습니다.",
        );
      } finally {
        setDeletingCommentId(
          null,
        );
      }
    };

  if (
    !isOpen ||
    !videoId
  ) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45"
      role="presentation"
      onClick={
        onClose
      }
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="영상 댓글"
        onClick={(
          event,
        ) =>
          event.stopPropagation()
        }
        className="flex max-h-[72dvh] min-h-[430px] w-full max-w-[390px] flex-col overflow-hidden rounded-t-[30px] bg-white"
      >
        {/* 상단 핸들 */}
        <div className="pt-[10px]">
          <div className="mx-auto h-[5px] w-[44px] rounded-full bg-[#D9D9D9]" />
        </div>

        {/* 헤더 */}
        <header className="relative flex h-[58px] shrink-0 items-center justify-center border-b border-[#EEEEEE] px-[20px]">
          <h2 className="text-label-2 text-black">
            댓글
            {totalCount > 0 &&
              ` ${totalCount}`}
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="댓글 닫기"
            className="absolute right-[20px] top-1/2 flex size-[32px] -translate-y-1/2 items-center justify-center text-[26px] font-light text-[#444444]"
          >
            ×
          </button>
        </header>

        {/* 댓글 목록 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[14px]">
          {isLoading ? (
            <div className="flex h-full min-h-[220px] items-center justify-center">
              <div className="size-[32px] animate-spin rounded-full border-[3px] border-surface-secondary border-t-accent-primary" />
            </div>
          ) : comments.length ===
            0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
              <p className="text-label-3 text-[#777777]">
                아직 댓글이 없어요
              </p>

              <p className="mt-[4px] text-caption text-[#AAAAAA]">
                첫 댓글을 남겨보세요!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[18px]">
              {comments.map(
                (
                  comment,
                ) => {
                  const isEditing =
                    editingCommentId ===
                    comment.id;

                  return (
                    <article
                      key={
                        comment.id
                      }
                      className="relative flex gap-[10px]"
                    >
                      <div className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full">
                        <img
                            src={
                            comment.author.profileImageUrl ||
                            defaultProfileIcon
                            }
                            alt=""
                            onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                                defaultProfileIcon;
                            }}
                            className="block h-full w-full object-cover"
                        />
                        </div>

                      <div className="min-w-0 flex-1 pr-[28px]">
                        <div className="flex items-center gap-[7px]">
                          <span className="truncate text-label-4 font-semibold text-black">
                            {comment
                              .author
                              .nickname ||
                              comment
                                .author
                                .username}
                          </span>

                          <span className="shrink-0 text-caption text-[#AAAAAA]">
                            {formatCommentTime(
                              comment.createdAt,
                            )}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="mt-[6px]">
                            <input
                                autoFocus
                                value={
                                    editingText
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setEditingText(
                                    event.target.value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                    event.key ===
                                        "Enter" &&
                                    !event.nativeEvent
                                        .isComposing &&
                                    editingText.trim() &&
                                    !isUpdating
                                    ) {
                                    event.preventDefault();

                                    void handleUpdate();
                                    }
                                }}
                                maxLength={
                                    200
                                }
                                className="h-[40px] w-full rounded-[20px] border border-accent-primary bg-white px-[14px] text-body text-black outline-none"
                                />

                            <div className="mt-[6px] flex justify-end gap-[8px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(
                                    null,
                                  );

                                  setEditingText(
                                    "",
                                  );
                                }}
                                disabled={
                                  isUpdating
                                }
                                className="text-caption text-[#888888]"
                              >
                                취소
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleUpdate()
                                }
                                disabled={
                                  !editingText.trim() ||
                                  isUpdating
                                }
                                className="text-caption font-semibold text-accent-deep disabled:opacity-40"
                              >
                                {isUpdating
                                  ? "수정 중..."
                                  : "완료"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-[3px] whitespace-pre-wrap break-words text-body leading-[145%] text-[#333333]">
                            {
                              comment.content
                            }
                          </p>
                        )}
                      </div>

                      {/* 내 댓글 메뉴 */}
                      {comment.isMine &&
                        !isEditing && (
                          <div className="absolute right-0 top-0">
                            <button
                              type="button"
                              aria-label="댓글 메뉴"
                              onClick={() =>
                                setOpenMenuId(
                                  (
                                    previous,
                                  ) =>
                                    previous ===
                                    comment.id
                                      ? null
                                      : comment.id,
                                )
                              }
                              className="flex size-[28px] items-center justify-center"
                            >
                              <img
                                src={
                                  moreVerticalIcon
                                }
                                alt=""
                                className="size-[16px] object-contain"
                              />
                            </button>

                            {openMenuId ===
                              comment.id && (
                              <div className="absolute right-0 top-[27px] z-20 w-[92px] overflow-hidden rounded-[10px] bg-white py-[3px] shadow-[0_4px_14px_rgba(0,0,0,0.16)]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartEdit(
                                      comment,
                                    )
                                  }
                                  className="flex h-[36px] w-full items-center px-[12px] text-left text-caption text-[#333333]"
                                >
                                  수정
                                </button>

                                <div className="mx-[10px] border-t border-[#EEEEEE]" />

                                <button
                                  type="button"
                                  disabled={
                                    deletingCommentId ===
                                    comment.id
                                  }
                                  onClick={() =>
                                    void handleDelete(
                                      comment.id,
                                    )
                                  }
                                  className="flex h-[36px] w-full items-center px-[12px] text-left text-caption text-danger disabled:opacity-50"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </article>
                  );
                },
              )}

              {hasNext && (
                <button
                  type="button"
                  onClick={() =>
                    void handleLoadMore()
                  }
                  disabled={
                    isLoadingMore
                  }
                  className="mx-auto py-[8px] text-caption text-[#777777]"
                >
                  {isLoadingMore
                    ? "불러오는 중..."
                    : "댓글 더보기"}
                </button>
              )}
            </div>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-[12px] text-center text-caption text-danger"
            >
              {
                errorMessage
              }
            </p>
          )}
        </div>

        {/* 댓글 입력 */}
        <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-[16px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[12px]">
          <div className="flex h-[48px] items-center gap-[8px] rounded-[24px] bg-[#F3F3F3] pl-[17px] pr-[5px]">
            <input
              ref={
                inputRef
              }
              value={
                inputValue
              }
              onChange={(
                event,
              ) => {
                setInputValue(
                  event.target
                    .value,
                );

                clientCommentIdRef.current =
                  null;
              }}
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.nativeEvent
                    .isComposing
                ) {
                  event.preventDefault();

                  void handleSubmit();
                }
              }}
              maxLength={
                200
              }
              placeholder="댓글을 입력해주세요"
              aria-label="댓글 입력"
              className="min-w-0 flex-1 bg-transparent text-body text-black outline-none placeholder:text-[#AAAAAA]"
            />

            <button
              type="button"
              onClick={() =>
                void handleSubmit()
              }
              disabled={
                !inputValue.trim() ||
                isSubmitting
              }
              aria-label="댓글 등록"
              className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-accent-primary text-[22px] font-semibold text-white disabled:bg-[#D9D9D9]"
            >
              ↑
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
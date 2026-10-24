import {
  useEffect,
  useMemo,
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
  getVideoComment,
  getVideoComments,
  updateVideoComment,
} from "../api/videoCommentApi";

import type {
  VideoComment,
} from "../types/videoComment";

type VideoCommentSheetProps = {
  isOpen: boolean;
  videoId: number | null;
  initialCommentId?: number | null;
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

function mergeComments(
  previous:
    VideoComment[],
  next:
    VideoComment[],
) {
  const map =
    new Map<
      number,
      VideoComment
    >();

  previous.forEach(
    (comment) => {
      map.set(
        comment.id,
        comment,
      );
    },
  );

  next.forEach(
    (comment) => {
      map.set(
        comment.id,
        comment,
      );
    },
  );

  return Array.from(
    map.values(),
  ).sort(
    (a, b) =>
      new Date(
        a.createdAt,
      ).getTime() -
      new Date(
        b.createdAt,
      ).getTime(),
  );
}

function getParentCommentId(
  comment:
    VideoComment,
) {
  const parentId =
    comment.parentCommentId;

  if (
    !parentId ||
    !Number.isSafeInteger(
      parentId,
    ) ||
    parentId <= 0
  ) {
    return null;
  }

  return parentId;
}

export function VideoCommentSheet({
  isOpen,
  videoId,
  initialCommentId = null,
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

  const commentRefs =
    useRef<
      Record<
        number,
        HTMLElement | null
      >
    >({});

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

  const [
    replyingTo,
    setReplyingTo,
  ] =
    useState<
      VideoComment | null
    >(null);

  const [
    expandedParents,
    setExpandedParents,
  ] =
    useState<
      Set<number>
    >(
      new Set(),
    );

  const [
    highlightedCommentId,
    setHighlightedCommentId,
  ] =
    useState<
      number | null
    >(null);

  const loadFirstPage =
    async (
      targetVideoId:
        number,
    ) => {
      const response =
        await getVideoComments(
          targetVideoId,
          {
            size: 20,
          },
        );

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

      return response;
    };

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

          let nextComments =
            response.items;

          if (
            initialCommentId
          ) {
            const alreadyLoaded =
              nextComments.some(
                (comment) =>
                  comment.id ===
                  initialCommentId,
              );

            if (
              !alreadyLoaded
            ) {
              try {
                const target =
                  await getVideoComment(
                    initialCommentId,
                  );

                if (
                  target.videoId ===
                  videoId
                ) {
                  nextComments =
                    mergeComments(
                      nextComments,
                      [
                        target,
                      ],
                    );

                  if (
                    getParentCommentId(
                      target,
                    )
                  ) {
                    const parentLoaded =
                      nextComments.some(
                        (
                          comment,
                        ) =>
                          comment.id ===
                          getParentCommentId(
                            target,
                          )!,
                      );

                    if (
                      !parentLoaded
                    ) {
                      try {
                        const parent =
                          await getVideoComment(
                            getParentCommentId(
                            target,
                          )!,
                          );

                        if (
                          parent.videoId ===
                          videoId
                        ) {
                          nextComments =
                            mergeComments(
                              nextComments,
                              [
                                parent,
                              ],
                            );
                        }
                      } catch (
                        parentError
                      ) {
                        console.error(
                          "부모 댓글 조회 실패:",
                          parentError,
                        );
                      }
                    }

                    setExpandedParents(
                      (
                        previous,
                      ) => {
                        const next =
                          new Set(
                            previous,
                          );

                        next.add(
                          getParentCommentId(
                          target,
                        )!,
                        );

                        return next;
                      },
                    );
                  }
                }
              } catch (
                targetError
              ) {
                console.error(
                  "알림 대상 댓글 조회 실패:",
                  targetError,
                );
              }
            }
          }

          if (
            cancelled
          ) {
            return;
          }

          if (
            initialCommentId
          ) {
            const targetComment =
              nextComments.find(
                (comment) =>
                  comment.id ===
                  initialCommentId,
              );

            const targetParentId =
              targetComment
                ? getParentCommentId(
                    targetComment,
                  )
                : null;

            if (
              targetParentId
            ) {
              setExpandedParents(
                (previous) => {
                  const next =
                    new Set(
                      previous,
                    );

                  next.add(
                    targetParentId,
                  );

                  return next;
                },
              );
            }
          }

          setComments(
            nextComments,
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

          if (
            initialCommentId
          ) {
            setHighlightedCommentId(
              initialCommentId,
            );
          }
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
    initialCommentId,
    isOpen,
    videoId,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      !highlightedCommentId ||
      isLoading
    ) {
      return;
    }

    const frame =
      requestAnimationFrame(
        () => {
          commentRefs.current[
            highlightedCommentId
          ]?.scrollIntoView({
            behavior:
              "smooth",
            block:
              "center",
          });
        },
      );

    const timer =
      window.setTimeout(
        () => {
          setHighlightedCommentId(
            null,
          );
        },
        2200,
      );

    return () => {
      cancelAnimationFrame(
        frame,
      );

      window.clearTimeout(
        timer,
      );
    };
  }, [
    highlightedCommentId,
    isLoading,
    isOpen,
  ]);

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

    setReplyingTo(
      null,
    );

    setExpandedParents(
      new Set(),
    );

    setHighlightedCommentId(
      null,
    );

    clientCommentIdRef.current =
      null;
  }, [
    isOpen,
  ]);

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

  const rootComments =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            getParentCommentId(
              comment,
            ) === null,
        ),
      [
        comments,
      ],
    );

  const repliesByParent =
    useMemo(() => {
        const result =
        new Map<
            number,
            VideoComment[]
        >();

        comments.forEach(
        (
            comment,
        ) => {
            const parentCommentId =
            getParentCommentId(
                comment,
            );

            if (
            parentCommentId ===
            null
            ) {
            return;
            }

            const replies =
            result.get(
                parentCommentId,
            ) ?? [];

            replies.push(
            comment,
            );

            result.set(
            parentCommentId,
            replies,
            );
        },
        );

        return result;
    }, [
        comments,
    ]);

  const orphanReplies =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            getParentCommentId(
              comment,
            ) !== null &&
            !comments.some(
              (candidate) =>
                candidate.id ===
                getParentCommentId(
                  comment,
                ),
            ),
        ),
      [
        comments,
      ],
    );

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
          (previous) =>
            mergeComments(
              previous,
              response.items,
            ),
        );

        setNextCursor(
          response.nextCursor,
        );

        setHasNext(
          response.hasNext,
        );

        setTotalCount(
          response.totalCount,
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

        const parentCommentId =
          replyingTo?.id ??
          null;

        const created =
          await createVideoComment(
            videoId,
            {
              clientCommentId,
              content,
              parentCommentId,
            },
          );

        setComments(
          (previous) =>
            mergeComments(
              previous,
              [
                created,
              ],
            ),
        );

        setTotalCount(
          (previous) =>
            previous + 1,
        );

        if (
          parentCommentId
        ) {
          setExpandedParents(
            (
              previous,
            ) => {
              const next =
                new Set(
                  previous,
                );

              next.add(
                parentCommentId,
              );

              return next;
            },
          );
        }

        setInputValue(
          "",
        );

        setReplyingTo(
          null,
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

  const handleStartReply =
    (
      comment:
        VideoComment,
    ) => {
      if (
        getParentCommentId(
          comment,
        ) !== null
      ) {
        return;
      }

      setReplyingTo(
        comment,
      );

      setInputValue(
        "",
      );

      requestAnimationFrame(
        () => {
          inputRef.current?.focus();
        },
      );
    };

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

  const handleDelete =
    async (
      commentId: number,
    ) => {
      if (
        deletingCommentId !==
          null ||
        !videoId
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

        /*
         * 원댓글 삭제 뒤 자식 표시 방식과 totalCount를
         * 서버 응답 기준으로 다시 맞춘다.
         */
        await loadFirstPage(
          videoId,
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

  const toggleReplies =
    (
      parentId: number,
    ) => {
      setExpandedParents(
        (
          previous,
        ) => {
          const next =
            new Set(
              previous,
            );

          if (
            next.has(
              parentId,
            )
          ) {
            next.delete(
              parentId,
            );
          } else {
            next.add(
              parentId,
            );
          }

          return next;
        },
      );
    };

  if (
    !isOpen ||
    !videoId
  ) {
    return null;
  }

  const renderComment =
    (
      comment:
        VideoComment,
      isReply = false,
    ) => {
      const isEditing =
        editingCommentId ===
        comment.id;

      const isHighlighted =
        highlightedCommentId ===
        comment.id;

      return (
        <article
          key={
            comment.id
          }
          ref={(
            element,
          ) => {
            commentRefs.current[
              comment.id
            ] =
              element;
          }}
          className={[
            "relative flex gap-[10px] rounded-[14px] px-[4px] py-[4px] transition-colors",
            isReply
              ? "ml-[42px]"
              : "",
            isHighlighted
              ? "bg-accent-primary/10"
              : "",
          ].join(
            " ",
          )}
        >
          <div className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full">
            <img
              src={
                comment.author
                  .profileImageUrl ||
                defaultProfileIcon
              }
              alt=""
              onError={(
                event,
              ) => {
                event.currentTarget.onerror =
                  null;

                event.currentTarget.src =
                  defaultProfileIcon;
              }}
              className="block h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 pr-[28px]">
            <div className="flex items-center gap-[7px]">
              <span className="truncate text-label-4 font-semibold text-black">
                {comment.author
                  .nickname ||
                  comment.author
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
                      event.target
                        .value,
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
              <>
                <p className="mt-[3px] whitespace-pre-wrap break-words text-body leading-[145%] text-[#333333]">
                  {
                    comment.content
                  }
                </p>

                {!isReply && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStartReply(
                        comment,
                      )
                    }
                    className="mt-[5px] text-caption font-medium text-[#A0A0A0]"
                  >
                    답글 달기
                  </button>
                )}
              </>
            )}
          </div>

          {comment.isMine &&
            !isEditing && (
              <div className="absolute right-0 top-[2px]">
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
                  <div className="absolute right-0 top-[27px] z-30 w-[92px] overflow-hidden rounded-[10px] bg-white py-[3px] shadow-[0_4px_14px_rgba(0,0,0,0.16)]">
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
    };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45"
      role="presentation"
      onPointerDown={(
        event,
      ) => {
        event.stopPropagation();
      }}
      onPointerMove={(
        event,
      ) => {
        event.stopPropagation();
      }}
      onPointerUp={(
        event,
      ) => {
        event.stopPropagation();
      }}
      onClick={(
        event,
      ) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="영상 댓글"
        onPointerDown={(
          event,
        ) => {
          event.stopPropagation();
        }}
        onPointerMove={(
          event,
        ) => {
          event.stopPropagation();
        }}
        onPointerUp={(
          event,
        ) => {
          event.stopPropagation();
        }}
        onClick={(
          event,
        ) => {
          event.stopPropagation();
        }}
        className="flex max-h-[72dvh] min-h-[430px] w-full max-w-[390px] flex-col overflow-hidden rounded-t-[30px] bg-white"
      >
        <div className="pt-[10px]">
          <div className="mx-auto h-[5px] w-[44px] rounded-full bg-[#D9D9D9]" />
        </div>

        <header className="relative flex h-[58px] shrink-0 items-center justify-center border-b border-[#EEEEEE] px-[20px]">
          <h2 className="text-label-2 text-black">
            댓글
            {totalCount > 0 &&
              ` ${totalCount}`}
          </h2>

          <button
            type="button"
            onPointerDown={(
              event,
            ) => {
              event.stopPropagation();
            }}
            onClick={(
              event,
            ) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="댓글 닫기"
            className="absolute right-[20px] top-1/2 z-30 flex size-[36px] -translate-y-1/2 items-center justify-center text-[26px] font-light text-[#444444]"
          >
            ×
          </button>
        </header>

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
              {rootComments.map(
                (
                  comment,
                ) => {
                  const replies =
                    repliesByParent.get(
                      comment.id,
                    ) ?? [];

                  const isExpanded =
                    expandedParents.has(
                      comment.id,
                    );

                  return (
                    <div
                      key={
                        comment.id
                      }
                    >
                      {
                        renderComment(
                          comment,
                        )
                      }

                      {replies.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleReplies(
                              comment.id,
                            )
                          }
                          className="ml-[52px] mt-[5px] text-caption font-medium text-[#A0A0A0]"
                        >
                          {isExpanded
                            ? `답글 ${replies.length}개 숨기기`
                            : `답글 ${replies.length}개 보기`}
                        </button>
                      )}

                      {isExpanded &&
                        replies.length >
                          0 && (
                          <div className="mt-[10px] flex flex-col gap-[14px]">
                            {replies.map(
                              (
                                reply,
                              ) =>
                                renderComment(
                                  reply,
                                  true,
                                ),
                            )}
                          </div>
                        )}
                    </div>
                  );
                },
              )}

              {orphanReplies.map(
                (
                  reply,
                ) =>
                  renderComment(
                    reply,
                    true,
                  ),
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

        <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-[16px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[10px]">
          {replyingTo && (
            <div className="mb-[8px] flex items-center justify-between px-[8px]">
              <p className="truncate text-caption text-[#888888]">
                {replyingTo.author
                  .nickname ||
                  replyingTo.author
                    .username}
                님에게 답글 작성 중
              </p>

              <button
                type="button"
                onClick={() =>
                  setReplyingTo(
                    null,
                  )
                }
                className="ml-[8px] shrink-0 text-caption text-[#AAAAAA]"
              >
                취소
              </button>
            </div>
          )}

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
              placeholder={
                replyingTo
                  ? `${replyingTo.author.nickname || replyingTo.author.username}님에게 답글 남기기`
                  : "댓글을 입력해주세요"
              }
              aria-label={
                replyingTo
                  ? "답글 입력"
                  : "댓글 입력"
              }
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
              aria-label={
                replyingTo
                  ? "답글 등록"
                  : "댓글 등록"
              }
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

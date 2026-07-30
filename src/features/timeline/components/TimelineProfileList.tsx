import { useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import profileMockIcon from "../../../assets/icons/profilemock.svg";
import { TimelineProfileItem } from "./TimelineProfileItem";

const DRAG_THRESHOLD = 10;

const profiles = [
  {
    id: "me",
    userId: "@my_id",
    profileImage: profileMockIcon,
    isMe: true,
    hasRecordedToday: false,
  },
  {
    id: "user-1",
    userId: "@user01",
    profileImage: profileMockIcon,
    isMe: false,
    hasRecordedToday: true,
  },
  {
    id: "user-2",
    userId: "@user02",
    profileImage: profileMockIcon,
    isMe: false,
    hasRecordedToday: false,
  },
  {
    id: "user-3",
    userId: "@user03",
    profileImage: profileMockIcon,
    isMe: false,
    hasRecordedToday: true,
  },
  {
    id: "user-4",
    userId: "@user04",
    profileImage: profileMockIcon,
    isMe: false,
    hasRecordedToday: false,
  },
  {
    id: "user-5",
    userId: "@user05",
    profileImage: profileMockIcon,
    isMe: false,
    hasRecordedToday: false,
  },
];

export function TimelineProfileList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scrollContainerRef = useRef<HTMLElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);

  const selectedUserId = searchParams.get("userId");
  const isViewingFriendTimeline = Boolean(selectedUserId);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    const container = scrollContainerRef.current;

    if (!container || !event.isPrimary) return;

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = container.scrollLeft;
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    const container = scrollContainerRef.current;

    if (!container || !isPointerDownRef.current) return;

    const movedDistance = event.clientX - dragStartXRef.current;

    if (!hasMovedRef.current) {
      if (Math.abs(movedDistance) < DRAG_THRESHOLD) return;

      hasMovedRef.current = true;
      container.setPointerCapture(event.pointerId);
    }

    container.scrollLeft =
      dragStartScrollLeftRef.current - movedDistance;
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLElement>,
  ) => {
    const container = scrollContainerRef.current;

    isPointerDownRef.current = false;

    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  const handleClickCapture = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    if (!hasMovedRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    hasMovedRef.current = false;
  };

  const handleFriendProfileClick = (userId: string) => {
    navigate(`/timeline?userId=${encodeURIComponent(userId)}`);
  };

  const handleRecordClick = () => {
    navigate("/home/record");
  };

  const handleBackToMyTimeline = () => {
    navigate("/timeline");
  };

  return (
    <section
      ref={scrollContainerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
      className="scrollbar-hide w-full cursor-grab touch-pan-x select-none overflow-x-auto px-[16px] py-[12px] active:cursor-grabbing"
    >
      <div className="flex min-w-max items-start gap-[18px]">
        {profiles.map((profile) => (
          <TimelineProfileItem
            key={profile.id}
            userId={profile.userId}
            profileImage={profile.profileImage}
            isMe={profile.isMe}
            hasRecordedToday={profile.hasRecordedToday}
            isViewingFriendTimeline={isViewingFriendTimeline}
            onProfileClick={
              profile.isMe
                ? undefined
                : () => handleFriendProfileClick(profile.userId)
            }
            onRecordClick={
              profile.isMe ? handleRecordClick : undefined
            }
            onBackClick={
              profile.isMe ? handleBackToMyTimeline : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
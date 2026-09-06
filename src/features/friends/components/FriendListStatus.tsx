type FriendListStatusProps = {
  message: string;
  tone?: "danger" | "neutral";
};

export function FriendListStatus({
  message,
  tone = "neutral",
}: FriendListStatusProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-[16px]">
      <p
        className={[
          "text-center",
          tone === "danger"
            ? "text-caption text-danger"
            : "text-label-3 text-text-secondary",
        ].join(" ")}
      >
        {message}
      </p>
    </main>
  );
}

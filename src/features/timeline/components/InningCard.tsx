type InningCardProps = {
  inning: number;
  children?: React.ReactNode;
};

export function InningCard({ inning, children }: InningCardProps) {
  return (
    <article className="relative h-[125px] w-[358px] rounded-[27.5px] bg-surface-secondary">
      <div className="absolute left-[25px] top-[22px] flex h-[19px] w-[19px] items-center justify-center rounded-full bg-bg-primary">
        <span className="text-caption-number translate-y-[-1px]">
          {inning}
        </span>
      </div>

      {children}
    </article>
  );
}

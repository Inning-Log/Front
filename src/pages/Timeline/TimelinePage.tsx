import { PageHeader } from "../../app/layouts/PageHeader";
import { InningCard } from "../../features/timeline/components/InningCard";

const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function TimelinePage() {
  return (
    <div className="min-h-dvh w-full pt-[45px]">
      <PageHeader title="타임라인" />

      <main className="flex flex-col items-center gap-[12px] px-[16px] pt-[20px]">
        {innings.map((inning) => (
          <InningCard key={inning} inning={inning} />
        ))}
      </main>
    </div>
  );
}
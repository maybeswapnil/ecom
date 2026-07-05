"use client";

import { useState } from "react";

type Orient = "all" | "landscape" | "portrait";
type Tone = "all" | "bw" | "colour";

const orientOptions: [Orient, string][] = [
  ["all", "All"],
  ["landscape", "Landscape"],
  ["portrait", "Portrait"],
];
const toneOptions: [Tone, string][] = [
  ["all", "All"],
  ["bw", "Black & white"],
  ["colour", "Colour"],
];

function FilterLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-transparent border-none py-0.5 cursor-pointer font-body text-[13px] border-b ${
        active ? "font-semibold text-ink border-ink" : "font-normal text-muted border-transparent"
      }`}
    >
      {label}
    </button>
  );
}

export type GridCard = {
  id: string;
  tags: string[];
  node: React.ReactNode;
};

export function PrintsGrid({ cards }: { cards: GridCard[] }) {
  const [orient, setOrient] = useState<Orient>("all");
  const [tone, setTone] = useState<Tone>("all");

  const filtered = cards.filter(
    (c) =>
      (orient === "all" || c.tags.includes(orient)) && (tone === "all" || c.tags.includes(tone))
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 gap-x-7 items-center border-t border-b border-hairline py-4 px-0.5">
        <div className="flex items-center gap-4.5 mr-5">
          <span className="text-[11px] tracking-[0.18em] uppercase text-faint">Orientation</span>
          <div className="flex gap-4">
            {orientOptions.map(([v, l]) => (
              <FilterLink key={v} label={l} active={orient === v} onClick={() => setOrient(v)} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4.5 mr-5">
          <span className="text-[11px] tracking-[0.18em] uppercase text-faint">Palette</span>
          <div className="flex gap-4">
            {toneOptions.map(([v, l]) => (
              <FilterLink key={v} label={l} active={tone === v} onClick={() => setTone(v)} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-14 block md:[column-count:3] md:gap-x-11">
        {filtered.map((c) => (
          <div key={c.id} className="mb-12 md:mb-16 break-inside-avoid">
            {c.node}
          </div>
        ))}
      </div>
    </>
  );
}

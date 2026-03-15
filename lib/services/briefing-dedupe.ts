import { createHash } from "node:crypto";

import type { Briefing } from "@/lib/domain/briefing/types";

export function buildBriefingDedupeKey(input: {
  cycleId: string;
  sourceEventIds: string[];
  briefingType: string;
}) {
  const sortedIds = [...input.sourceEventIds].sort();
  const raw = `${input.cycleId}:${input.briefingType}:${sortedIds.join("|")}`;
  return createHash("sha256").update(raw).digest("hex");
}

export function findExistingBriefingByDedupeKey(briefings: Briefing[], dedupeKey: string) {
  return (
    briefings.find((briefing) => {
      const metadata = briefing.metadata as Record<string, unknown>;
      return metadata.dedupeKey === dedupeKey;
    }) ?? null
  );
}

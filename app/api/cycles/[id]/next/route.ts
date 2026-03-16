import { NextResponse } from "next/server";
import { z } from "zod";

import { launchNextCycleFromArtifactFeedback } from "@/lib/services/launch-next-cycle";

const requestSchema = z.object({
  artifactId: z.string().min(1),
  action: z.enum(["approved", "adopted", "published", "reused"]).default("published"),
  reasonCode: z.string().optional(),
  note: z.string().optional(),
  editBehaviorHints: z.array(z.string()).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = requestSchema.parse(await request.json());

    const result = await launchNextCycleFromArtifactFeedback({
      cycleId: id,
      feedback: {
        artifactId: payload.artifactId,
        action: payload.action,
        reasonCode: payload.reasonCode,
        note: payload.note,
        editBehaviorHints: payload.editBehaviorHints
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid next-cycle payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to launch next cycle"
      },
      { status: 500 }
    );
  }
}

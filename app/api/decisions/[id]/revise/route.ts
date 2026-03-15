import { NextResponse } from "next/server";
import { z } from "zod";

import { updateDecision } from "@/lib/domain/decision/repository";
import { resumeReviewFeedbackGraph } from "@/lib/workflows/review-feedback/graph";

const reviseRequestSchema = z.object({
  threadId: z.string().min(1),
  note: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = reviseRequestSchema.parse(await request.json());

    const decision = await updateDecision({
      decisionId: id,
      status: "rejected",
      resolution: payload.note ?? "revise_requested",
      resolutionPayload: {
        ownerAction: "revise"
      },
      decidedAt: new Date()
    });

    const workflow = await resumeReviewFeedbackGraph(payload.threadId, {
      action: "revise",
      note: payload.note
    });

    return NextResponse.json({
      decision,
      workflowState: workflow.state.values
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid revise payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to request revision"
      },
      { status: 500 }
    );
  }
}

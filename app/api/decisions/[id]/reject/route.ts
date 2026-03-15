import { NextResponse } from "next/server";
import { z } from "zod";

import { updateDecision } from "@/lib/domain/decision/repository";
import { resumeDecisionReviewWorkflow } from "@/lib/services/decision-workflow";

const rejectRequestSchema = z.object({
  note: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = rejectRequestSchema.parse(await request.json());

    const decision = await updateDecision({
      decisionId: id,
      status: "rejected",
      resolution: payload.note ?? "rejected",
      resolutionPayload: {
        ownerAction: "reject"
      },
      decidedAt: new Date()
    });

    const workflow = await resumeDecisionReviewWorkflow({
      decisionId: id,
      ownerChoice: {
        action: "reject",
        note: payload.note
      }
    });

    return NextResponse.json({
      decision: workflow.decision ?? decision,
      workflowState: workflow.workflow.state.values
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid rejection payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to reject decision"
      },
      { status: 500 }
    );
  }
}

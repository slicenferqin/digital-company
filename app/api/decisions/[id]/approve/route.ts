import { NextResponse } from "next/server";
import { z } from "zod";

import { updateDecision } from "@/lib/domain/decision/repository";
import { resumeDecisionReviewWorkflow } from "@/lib/services/decision-workflow";

const approveRequestSchema = z.object({
  note: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = approveRequestSchema.parse(await request.json());

    const decision = await updateDecision({
      decisionId: id,
      status: "approved",
      resolution: payload.note ?? "approved",
      resolutionPayload: {
        ownerAction: "approve"
      },
      decidedAt: new Date()
    });

    const workflow = await resumeDecisionReviewWorkflow({
      decisionId: id,
      ownerChoice: {
        action: "approve",
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
          error: "Invalid approval payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to approve decision"
      },
      { status: 500 }
    );
  }
}

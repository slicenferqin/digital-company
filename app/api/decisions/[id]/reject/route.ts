import { NextResponse } from "next/server";
import { z } from "zod";

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

    const workflow = await resumeDecisionReviewWorkflow({
      decisionId: id,
      ownerChoice: {
        action: "reject",
        note: payload.note
      }
    });

    return NextResponse.json({
      decision: workflow.decision,
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

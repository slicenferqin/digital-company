import { NextResponse } from "next/server";
import { z } from "zod";

import { captureArtifactFeedback } from "@/lib/services/feedback-capture";

const feedbackRequestSchema = z.object({
  action: z.enum(["approved", "adopted", "published", "reused"]),
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
    const payload = feedbackRequestSchema.parse(await request.json());

    const result = await captureArtifactFeedback({
      artifactId: id,
      action: payload.action,
      reasonCode: payload.reasonCode,
      note: payload.note,
      editBehaviorHints: payload.editBehaviorHints
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid feedback payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to capture artifact feedback"
      },
      { status: 500 }
    );
  }
}

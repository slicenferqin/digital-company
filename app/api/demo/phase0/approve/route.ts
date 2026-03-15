import { NextResponse } from "next/server";
import { z } from "zod";

import { approvePhase0DemoDecision } from "@/lib/demo/phase0-demo";

const approveSchema = z.object({
  sessionId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = approveSchema.parse(await request.json());
    const result = await approvePhase0DemoDecision(payload.sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid demo approval payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to approve phase0 demo decision"
      },
      { status: 500 }
    );
  }
}

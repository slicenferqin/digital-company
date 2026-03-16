import { NextResponse } from "next/server";

import { advanceCycleExecution } from "@/lib/services/cycle-execution";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await advanceCycleExecution({
      cycleId: id
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to advance cycle"
      },
      { status: 500 }
    );
  }
}

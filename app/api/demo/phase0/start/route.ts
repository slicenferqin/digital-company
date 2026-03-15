import { NextResponse } from "next/server";

import { startPhase0Demo } from "@/lib/demo/phase0-demo";

export async function POST() {
  try {
    const result = await startPhase0Demo();
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to start phase0 demo"
      },
      { status: 500 }
    );
  }
}

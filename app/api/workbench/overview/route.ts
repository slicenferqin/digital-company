import { NextResponse } from "next/server";

import { getWorkbenchOverview } from "@/lib/services/workbench-overview";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId") ?? undefined;

    const overview = await getWorkbenchOverview(teamId);

    if (!overview) {
      return NextResponse.json(
        {
          overview: null
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      overview
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to load workbench overview"
      },
      { status: 500 }
    );
  }
}

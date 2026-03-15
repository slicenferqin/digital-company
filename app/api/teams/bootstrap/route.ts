import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { parseTeamBootstrapInput } from "@/lib/services/business-profile";
import { bootstrapTeam } from "@/lib/services/team-bootstrap";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = parseTeamBootstrapInput(payload);
    const result = await bootstrapTeam(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid bootstrap payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to bootstrap team"
      },
      { status: 500 }
    );
  }
}

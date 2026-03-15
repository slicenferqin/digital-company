import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { bootstrapTeam } from "@/lib/services/team-bootstrap";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await bootstrapTeam({
      mode: "manual",
      ...payload
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid team payload",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create team"
      },
      { status: 500 }
    );
  }
}

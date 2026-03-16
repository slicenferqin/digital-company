import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { parseTeamBootstrapInput } from "@/lib/services/business-profile";
import { bootstrapTeamWithInitialCycle } from "@/lib/services/bootstrap-team-with-initial-cycle";
import { bootstrapTeam } from "@/lib/services/team-bootstrap";

const bootstrapRequestSchema = z
  .object({
    seedInitialCycle: z.boolean().optional()
  })
  .passthrough();

export async function POST(request: Request) {
  try {
    const payload = bootstrapRequestSchema.parse(await request.json());
    const { seedInitialCycle = true, ...inputPayload } = payload;
    const input = parseTeamBootstrapInput(inputPayload);
    const result = seedInitialCycle
      ? await bootstrapTeamWithInitialCycle(input)
      : await bootstrapTeam(input);

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

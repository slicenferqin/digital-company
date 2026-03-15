import { z } from "zod";

const manualBootstrapSchema = z.object({
  mode: z.literal("manual"),
  teamName: z.string().min(1).optional(),
  businessName: z.string().min(1),
  businessPositioning: z.string().min(1).optional(),
  brandVoice: z.string().min(1).optional(),
  targetAudience: z.string().min(1).optional(),
  coreOffer: z.string().min(1).optional(),
  primaryChannels: z.array(z.string().min(1)).default([])
});

const reverseEngineeredBootstrapSchema = z.object({
  mode: z.literal("reverse_engineered"),
  sourceUrl: z.string().url().optional(),
  sourceNotes: z.string().min(1).optional(),
  extractedProfile: z.object({
    teamName: z.string().min(1).optional(),
    businessName: z.string().min(1),
    businessPositioning: z.string().min(1).optional(),
    brandVoice: z.string().min(1).optional(),
    targetAudience: z.string().min(1).optional(),
    coreOffer: z.string().min(1).optional(),
    primaryChannels: z.array(z.string().min(1)).default([])
  })
});

export const teamBootstrapInputSchema = z.union([
  manualBootstrapSchema,
  reverseEngineeredBootstrapSchema
]);

export type TeamBootstrapInput = z.infer<typeof teamBootstrapInputSchema>;

export interface BusinessProfile {
  sourceMode: TeamBootstrapInput["mode"];
  teamName: string;
  businessName: string;
  businessPositioning: string | null;
  brandVoice: string | null;
  targetAudience: string | null;
  coreOffer: string | null;
  primaryChannels: string[];
  sourceUrl: string | null;
  sourceNotes: string | null;
}

function fallbackTeamName(businessName: string) {
  return `${businessName} 内容增长团队`;
}

export function parseTeamBootstrapInput(payload: unknown) {
  return teamBootstrapInputSchema.parse(payload);
}

export function resolveBusinessProfile(input: TeamBootstrapInput): BusinessProfile {
  if (input.mode === "manual") {
    return {
      sourceMode: input.mode,
      teamName: input.teamName ?? fallbackTeamName(input.businessName),
      businessName: input.businessName,
      businessPositioning: input.businessPositioning ?? null,
      brandVoice: input.brandVoice ?? null,
      targetAudience: input.targetAudience ?? null,
      coreOffer: input.coreOffer ?? null,
      primaryChannels: input.primaryChannels,
      sourceUrl: null,
      sourceNotes: null
    };
  }

  const profile = input.extractedProfile;

  return {
    sourceMode: input.mode,
    teamName: profile.teamName ?? fallbackTeamName(profile.businessName),
    businessName: profile.businessName,
    businessPositioning: profile.businessPositioning ?? null,
    brandVoice: profile.brandVoice ?? null,
    targetAudience: profile.targetAudience ?? null,
    coreOffer: profile.coreOffer ?? null,
    primaryChannels: profile.primaryChannels,
    sourceUrl: input.sourceUrl ?? null,
    sourceNotes: input.sourceNotes ?? null
  };
}

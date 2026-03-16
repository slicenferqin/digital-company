import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "digital-company"
});

export const schedulingEventNames = {
  cycleStart: "digital-company/scheduling.cycle-start",
  dayTick: "digital-company/scheduling.day-tick",
  resumeAfterDecision: "digital-company/scheduling.resume-after-decision"
} as const;

export const workflowEntrypointNames = {
  cyclePlanning: "cycle-planning",
  cycleExecution: "cycle-execution",
  reviewFeedback: "review-feedback"
} as const;

export type SchedulingEventName =
  (typeof schedulingEventNames)[keyof typeof schedulingEventNames];
export type WorkflowEntrypointName =
  (typeof workflowEntrypointNames)[keyof typeof workflowEntrypointNames];

export interface WorkflowEntrypointRequest {
  workflow: WorkflowEntrypointName;
  input: Record<string, unknown>;
}

export interface InngestSender {
  send: (
    event:
      | {
          name: SchedulingEventName;
          data: Record<string, unknown>;
        }
      | Array<{
          name: SchedulingEventName;
          data: Record<string, unknown>;
        }>
  ) => Promise<unknown>;
}

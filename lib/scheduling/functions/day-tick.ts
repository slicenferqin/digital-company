import {
  inngest,
  schedulingEventNames,
  workflowEntrypointNames,
  type InngestSender,
  type WorkflowEntrypointRequest
} from "../inngest";

export interface DayTickPayload {
  teamId: string;
  cycleId: string;
  occurredAt: string;
  focusQuery?: string;
}

export function buildDayTickEntrypoints(payload: DayTickPayload): WorkflowEntrypointRequest[] {
  return [
    {
      workflow: workflowEntrypointNames.cycleExecution,
      input: {
        teamId: payload.teamId,
        cycleId: payload.cycleId,
        occurredAt: payload.occurredAt,
        focusQuery: payload.focusQuery ?? null
      }
    }
  ];
}

export async function enqueueDayTick(
  payload: DayTickPayload,
  sender: InngestSender = inngest
) {
  return sender.send({
    name: schedulingEventNames.dayTick,
    data: {
      ...payload
    }
  });
}

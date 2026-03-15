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
      workflow: workflowEntrypointNames.research,
      input: {
        teamId: payload.teamId,
        cycleId: payload.cycleId,
        query: payload.focusQuery ?? "本周期高优先级主题研究",
        providerKey: "stub"
      }
    },
    {
      workflow: workflowEntrypointNames.production,
      input: {
        teamId: payload.teamId,
        cycleId: payload.cycleId
      }
    },
    {
      workflow: workflowEntrypointNames.briefing,
      input: {
        teamId: payload.teamId,
        cycleId: payload.cycleId,
        type: "daily",
        occurredAt: payload.occurredAt
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

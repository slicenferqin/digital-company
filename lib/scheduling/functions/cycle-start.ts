import {
  inngest,
  schedulingEventNames,
  workflowEntrypointNames,
  type InngestSender,
  type WorkflowEntrypointRequest
} from "../inngest";

export interface CycleStartPayload {
  teamId: string;
  startAt: string;
  endAt: string;
  requestedGoalSummary?: string;
  requestedPriorityFocus?: string;
}

export function buildCycleStartEntrypoints(
  payload: CycleStartPayload
): WorkflowEntrypointRequest[] {
  return [
    {
      workflow: workflowEntrypointNames.cyclePlanning,
      input: {
        teamId: payload.teamId,
        startAt: payload.startAt,
        endAt: payload.endAt,
        requestedGoalSummary: payload.requestedGoalSummary ?? null,
        requestedPriorityFocus: payload.requestedPriorityFocus ?? null
      }
    }
  ];
}

export async function enqueueCycleStart(
  payload: CycleStartPayload,
  sender: InngestSender = inngest
) {
  return sender.send({
    name: schedulingEventNames.cycleStart,
    data: {
      ...payload
    }
  });
}

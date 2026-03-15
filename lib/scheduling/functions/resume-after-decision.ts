import {
  inngest,
  schedulingEventNames,
  workflowEntrypointNames,
  type InngestSender,
  type WorkflowEntrypointRequest
} from "../inngest";

export interface ResumeAfterDecisionPayload {
  teamId: string;
  decisionId: string;
  threadId: string;
  action: "approve" | "reject" | "revise";
}

export function buildResumeAfterDecisionEntrypoints(
  payload: ResumeAfterDecisionPayload
): WorkflowEntrypointRequest[] {
  return [
    {
      workflow: workflowEntrypointNames.reviewFeedback,
      input: {
        teamId: payload.teamId,
        decisionId: payload.decisionId,
        threadId: payload.threadId,
        action: payload.action
      }
    }
  ];
}

export async function enqueueResumeAfterDecision(
  payload: ResumeAfterDecisionPayload,
  sender: InngestSender = inngest
) {
  return sender.send({
    name: schedulingEventNames.resumeAfterDecision,
    data: {
      ...payload
    }
  });
}

import {
  advanceCycleExecution,
  type AdvanceCycleExecutionResult
} from "@/lib/services/cycle-execution";

export interface CycleExecutionInput {
  teamId: string;
  cycleId: string;
  occurredAt?: string;
}

type CycleExecutionWorkflowDependencies = {
  advanceCycleExecution: typeof advanceCycleExecution;
};

const defaultDependencies: CycleExecutionWorkflowDependencies = {
  advanceCycleExecution
};

export async function runCycleExecutionWorkflow(
  input: CycleExecutionInput,
  dependencies: CycleExecutionWorkflowDependencies = defaultDependencies
): Promise<AdvanceCycleExecutionResult> {
  return dependencies.advanceCycleExecution({
    cycleId: input.cycleId
  });
}

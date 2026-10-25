import { Deck } from "@talks/slide-engine";
import { talkTheme } from "./theme";
import { TitleSlide } from "./slides/Title";
import { TrialTimelineSlide } from "./slides/TrialTimeline";
import { CronImplementationSlide } from "./slides/CronImplementation";
import { CrashBetweenWritesSlide } from "./slides/CrashBetweenWrites";
import { InfinitelyReliableComputerSlide } from "./slides/InfinitelyReliableComputer";
import { StraightforwardPythonSlide } from "./slides/StraightforwardPython";
import { DurableExecutionSlide } from "./slides/DurableExecution";
import { LineageSlide } from "./slides/Lineage";
import { WorkflowAndActivitySlide } from "./slides/WorkflowAndActivity";
import { ApplyWorkflowsQuestionSlide } from "./slides/ApplyWorkflowsQuestion";
import { TinyReplayRuntimeSlide } from "./slides/TinyReplayRuntime";
import { ApplyWorkflowSlide } from "./slides/ApplyWorkflow";
import { TemporalRevealSlide } from "./slides/TemporalReveal";
import { CaseSagaSlide } from "./slides/CaseSaga";
import { CaseWebhookSlide } from "./slides/CaseWebhook";
import { CaseDocumentsSlide } from "./slides/CaseDocuments";
import { CaseReviewSlide } from "./slides/CaseReview";
import { CaseTenantSlide } from "./slides/CaseTenant";
import { CaseSyncSlide } from "./slides/CaseSync";
import { WorkflowSubsetSlide } from "./slides/WorkflowSubset";
import { ChangeTheCodeSlide } from "./slides/ChangeTheCode";
import { TimeSkippingTestsSlide } from "./slides/TimeSkippingTests";
import { TemporalArchitectureSlide } from "./slides/TemporalArchitecture";
import { ObservabilitySlide } from "./slides/Observability";
import { MicroservicesSlide } from "./slides/Microservices";
import { ChoosingExecutionModelSlide } from "./slides/ChoosingExecutionModel";
import { NextBackgroundFeatureSlide } from "./slides/NextBackgroundFeature";
import { ClosingSlide } from "./slides/Closing";

// Cut list (files kept for Q&A or a longer slot; see RESEARCH.md): AIAgents, BetterPrompt.
export function App() {
  return (
    <Deck title="Durable Python: from running custom SQS workers and Celery to Temporal" theme={talkTheme}>
      <TitleSlide />
      <TrialTimelineSlide />
      <CronImplementationSlide />
      <CrashBetweenWritesSlide />
      <InfinitelyReliableComputerSlide />
      <StraightforwardPythonSlide />
      <DurableExecutionSlide />
      <LineageSlide />
      <WorkflowAndActivitySlide />
      <ApplyWorkflowsQuestionSlide />
      <TinyReplayRuntimeSlide />
      <ApplyWorkflowSlide />
      <TemporalRevealSlide />
      <CaseSagaSlide />
      <CaseWebhookSlide />
      <CaseDocumentsSlide />
      <CaseReviewSlide />
      <CaseTenantSlide />
      <CaseSyncSlide />
      <WorkflowSubsetSlide />
      <ChangeTheCodeSlide />
      <TimeSkippingTestsSlide />
      <TemporalArchitectureSlide />
      <ObservabilitySlide />
      <MicroservicesSlide />
      <ChoosingExecutionModelSlide />
      <NextBackgroundFeatureSlide />
      <ClosingSlide />
    </Deck>
  );
}

import { Slide, SlideImage, SpeakerNote } from "@talks/slide-engine";
import webUiWorkflows from "../assets/web-ui-workflows.png";

export function ObservabilitySlide() {
  return (
    <Slide title="The dashboard ships with the service" kicker="Observability" layout="wide">
      <div className="[&_img]:mx-auto [&_img]:max-h-[min(54cqh,27rem)] [&_img]:w-auto [&_img]:object-contain">
        <SlideImage
          src={webUiWorkflows}
          alt="Temporal Web UI Workflows page listing 79,534 workflows, with status counts for running, timed out, completed, failed, canceled, and terminated, and a filterable, searchable table of workflow IDs"
          caption="→ Every workflow, every status, searchable by ID — the Visibility store from the architecture slide, with a page on it."
        />
      </div>
      <SpeakerNote>
        <p className="font-bold">24 The dashboard ships with the service / 35:15–36:15 / 1:00</p>
        <p className="italic">This is a real screenshot from one of my own projects, not a demo account.</p>
        <p>
          Before you reach for OpenTelemetry, Grafana, or a hand-rolled admin page: you already have
          this. The Web UI ships with the Temporal CLI and every self-hosted server, and it's the
          same interface on Temporal Cloud.
        </p>
        <p>
          This is the Workflows page. Status counts across the whole namespace — running, timed out,
          completed, failed, canceled, terminated — and a searchable, filterable table underneath.
          Filter by status, workflow ID, workflow type, or any search attribute you've defined.
        </p>
        <p>
          This is the Visibility store we saw on the architecture slide, with a UI on top. Click into
          any one of these 79,534 rows and you get that workflow's full event history — every timer,
          every activity attempt, every retry — for free, because the history was always the point.
        </p>
        <p>
          Honest cost: this list is the eventually consistent Visibility store, so never build logic on "list, then act."
          And it shows you Temporal's own state, not your business metrics — you'll still want normal
          application observability for everything outside the workflow boundary.
        </p>
        <p>Transition: one namespace, one list. So what about microservices?</p>
      </SpeakerNote>
    </Slide>
  );
}

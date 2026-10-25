import { Slide, SpeakerNote, useDeck, useFrames, useSceneClock } from "@talks/slide-engine";
import { AlertAgent } from "./companions/AlertAgent";
import { ImagePipeline } from "./companions/ImagePipeline";
import { Ingestion } from "./companions/Ingestion";
import { RackRds } from "./companions/RackRds";
import { SceneAlign } from "./companions/shared";

const STEPS = [
  { tab: "Images", claim: "Native libraries do the pixels. Ruby is the glue.", story: "A seller uploads a sofa photo. The listing gets a thumbnail and a category without filling a form.", cost: "Native gems must be built for Lambda's Linux.", Scene: ImagePipeline, still: 4.4, layout: "below" },
  { tab: "Ingestion", claim: "API, queue and workers, all Ruby. Unknown load, so pay per message.", story: "Three couriers post delivery updates. Quiet all day, then a flood when the evening rounds finish.", cost: "Workers that reach the data live in the VPC. Plan the networking.", Scene: Ingestion, still: 2, layout: "right" },
  { tab: "Alert agent", claim: "An alert wakes a Ruby agent. The report lands in S3.", story: "Checkout errors pass 2%. The agent reads logs, recent deploys and failed payments, then drafts the incident note.", cost: "15-minute ceiling per run.", Scene: AlertAgent, still: 5.2, layout: "left" },
  { tab: "The whole app", claim: "Sinatra and Sequel, unchanged. A Rack app serving SQL straight from Lambda.", story: "The support team's order lookup. Ten people use it, so at night it costs nothing.", cost: "Every environment opens its own connection. Pool them.", Scene: RackRds, still: 8.5, layout: "above" },
];

// Hooks live here: the deck calls slide functions directly to read titles and notes.
function Companions() {
  const { step, frame } = useFrames(STEPS);
  const t = useSceneClock(step, frame.still);
  const deck = useDeck();
  const { Scene } = frame;
  return (
    <div className="ruby-companions" data-layout={frame.layout}>
      <header>
        <p className="ruby-label">{"05 / Where Lambda gets used"}</p>
        <h2>{"Ruby on Lambda fits beside the product"}</h2>
        <nav className="ruby-tabs" aria-label="Examples">
          {STEPS.map((s, i) => (
            <button key={s.tab} type="button" aria-pressed={i === step} onClick={() => deck.goToStep(i)}>
              <span>{String(i + 1).padStart(2, "0")}</span>{s.tab}
            </button>
          ))}
        </nav>
      </header>
      <div className="ruby-companions-cap" key={`cap-${step}`}>
        <h3>{frame.tab}</h3>
        <p>{frame.claim}</p>
        <p className="ruby-companions-story">{frame.story}</p>
        <p className="ruby-companions-cost">{frame.cost}</p>
      </div>
      <div className="ruby-companions-scene" key={`scene-${step}`}>
        <SceneAlign.Provider value={frame.layout === "right" ? "xMaxYMid meet" : frame.layout === "left" ? "xMinYMid meet" : "xMidYMid meet"}>
          <Scene t={t} />
        </SceneAlign.Provider>
      </div>
    </div>
  );
}

export function Slide02Slide() {
  return (
    <Slide title={"Ruby on Lambda fits beside the product"} hideTitle layout="wide" className="ruby-slide ruby-slide-02">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <Companions />
      <SpeakerNote>
        <p>{"Picture one product through all four: a secondhand furniture marketplace. It already runs on Puma, Fargate or Kubernetes, and it stays there. The small grid in each scene is that product. Each example is something that wants to live beside it in its own repository, still written in Ruby, without polluting the main code base."}</p>
        <p>{"Images: thumbnails with libvips and tags from an open-source model through ONNX Runtime. Native code does the heavy lifting; four lines of Ruby orchestrate it. The catch is packaging: native gems must be compiled for Lambda's Linux, in a layer or a container image."}</p>
        <p>{"Ingestion: an API endpoint, an SQS queue and a worker handler, all Ruby, deployed with SST or plain CloudFormation. We don't know the load yet, so paying per message beats paying for idle servers. The catch is networking: the workers have to reach the main app's database inside the VPC."}</p>
        <p>{"Alert agent: an alert calls a small API, Lambda starts, a Ruby agent works through its tool calls and writes a report to S3. It only works because the job fits inside fifteen minutes; the timer under the box is the honest constraint."}</p>
        <p>{"The whole app: the crazy one. The left panel zooms into one environment. It is the same Ruby you would run on Puma: lamby turns the Lambda event into a Rack env, Sinatra routes it, Sequel builds the query, pg sends it over a socket. Nothing in the app knows it is on Lambda. ActiveRecord works too; Sequel is just lighter to boot."}</p>
        <p>{"The line that matters is the connect at the top. It runs once per environment at init, and every environment keeps its own socket open. On the right, load grows, Lambda adds environments, and Postgres answers: sorry, too many clients already. Point DATABASE_URL at RDS Proxy and it pools them. That is the thread we follow for the rest of the talk."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"Images: Ruby as glue over native libraries."}</li>
          <li>{"Ingestion: queue absorbs the burst, VPC networking is the cost."}</li>
          <li>{"Alert agent: separate repo, 15-minute ceiling."}</li>
          <li>{"The whole app: Sinatra + Sequel on Lambda, one connection per environment, RDS Proxy."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html" target="_blank" rel="noopener noreferrer">{"Lambda quotas (15-minute timeout)"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html" target="_blank" rel="noopener noreferrer">{"Lambda VPC internet access"}</a></p>
        <p><a href="https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html" target="_blank" rel="noopener noreferrer">{"Amazon RDS Proxy"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}

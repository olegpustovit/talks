import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, StepRow, useLoopFrames, type StepState } from "@talks/slide-engine";
import { at, caseSnippet } from "../caseCode";

const CODE = `${caseSnippet("opts")}\n\n${caseSnippet("checkout")}`;

const FORWARD = [
  { label: "reserve_inventory", detail: "2 × trail runner" },
  { label: "charge_payment", detail: "$180" },
  { label: "create_shipment", detail: "courier" },
];

const UNDO = [
  { label: "cancel_shipment", detail: "nothing to cancel" },
  { label: "refund_payment", detail: "+$180" },
  { label: "release_inventory", detail: "stock +2" },
];

type Frame = {
  lines: number[];
  forward: StepState[];
  registered: number;
  undo: StepState[];
  stock: number;
  card: string;
  flash?: "stock" | "card";
  status: string;
  ms?: number;
};

const IDLE: StepState[] = ["idle", "idle", "idle"];
const FAILED: StepState[] = ["done", "done", "failed"];

const FRAMES: Frame[] = [
  { lines: [], forward: IDLE, registered: 0, undo: IDLE, stock: 12, card: "$0", status: "Order #1042: two pairs of trail runners, $180." },
  { lines: at(CODE, "reserve_inventory,", 3, -2), forward: ["active", "idle", "idle"], registered: 1, undo: IDLE, stock: 12, card: "$0", status: "Put release_inventory on the undo list, then reserve the stock." },
  { lines: at(CODE, "charge_payment,", 3, -2), forward: ["done", "active", "idle"], registered: 2, undo: IDLE, stock: 10, card: "$0", flash: "stock", status: "Put refund_payment on the list, then charge the card." },
  { lines: at(CODE, "create_shipment,", 3, -2), forward: ["done", "done", "active"], registered: 3, undo: IDLE, stock: 10, card: "$180", flash: "card", status: "Put cancel_shipment on the list, then book the courier." },
  { lines: at(CODE, "create_shipment,", 2, -1), forward: FAILED, registered: 3, undo: IDLE, stock: 10, card: "$180", status: "The courier rejects the address. The activity fails.", ms: 2600 },
  { lines: at(CODE, "except ActivityError", 2), forward: FAILED, registered: 3, undo: IDLE, stock: 10, card: "$180", status: "ActivityError lands in except. Walk the undo list from the top." },
  { lines: at(CODE, "compensate, order_id", 2, -1), forward: FAILED, registered: 3, undo: ["done", "idle", "idle"], stock: 10, card: "$180", status: "cancel_shipment: nothing was booked, and that has to be fine." },
  { lines: at(CODE, "compensate, order_id", 2, -1), forward: FAILED, registered: 3, undo: ["done", "done", "idle"], stock: 10, card: "$0", flash: "card", status: "refund_payment puts the $180 back." },
  { lines: at(CODE, "compensate, order_id", 2, -1), forward: FAILED, registered: 3, undo: ["done", "done", "done"], stock: 12, card: "$0", flash: "stock", status: "release_inventory puts the stock back." },
  { lines: at(CODE, "        raise"), forward: FAILED, registered: 3, undo: ["done", "done", "done"], stock: 12, card: "$0", status: "Then raise. The order fails loudly, with nothing left half-done." },
];

const LABEL = "m-0 text-[0.8rem] font-bold tracking-tighter text-muted";

function Checkout({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="shop · order #1042" meta="checkout" status={frame.status}>
      <div className="flex gap-2">
        <Stat label="Stock left" value={frame.stock} accent={frame.flash === "stock"} />
        <Stat label="Card charged" value={frame.card} accent={frame.flash === "card"} />
      </div>
      <div className="flex flex-col gap-1">
        <p className={LABEL}>Steps</p>
        {FORWARD.map((row, i) => (
          <StepRow key={row.label} label={row.label} detail={frame.forward[i] === "failed" ? "address rejected" : row.detail} state={frame.forward[i]!} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className={LABEL}>Undo list · runs top to bottom</p>
        {UNDO.map((row, i) => (
          <div
            key={row.label}
            className={["transition-all duration-500", UNDO.length - i <= frame.registered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"].join(" ")}
          >
            <StepRow label={row.label} detail={frame.undo[i] === "done" ? row.detail : "on the list"} state={frame.undo[i] === "done" ? "undone" : "idle"} />
          </div>
        ))}
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="cases.py · Checkout" highlightLines={frame.lines} />
      <Checkout frame={frame} />
    </div>
  );
}

export function CaseSagaSlide() {
  return (
    <Slide title="A failed shipment refunds the card" kicker="Case study · saga" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">14 A failed shipment refunds the card / 20:15–21:45 / 1:30</p>
        <p className="italic">The animation loops by itself. Talk over it; don't wait for it.</p>
        <p>So what can you build with this? First, checkout. Reserve stock, charge the card, book a courier. Three services, and no transaction that spans them.</p>
        <p>Before each step, its undo goes on a list. Before, not after: if the charge succeeds and the worker dies before we record it, we still know a refund might be owed.</p>
        <p>The courier rejects the address. The activity fails, and the failure shows up in the workflow as an ActivityError. Plain try and except.</p>
        <p>We walk the undo list in reverse, newest first: that's top to bottom on the panel. cancel_shipment has nothing to cancel, so it has to be safe to call anyway. Refund the card, release the stock, then raise so the order fails loudly.</p>
        <p>Durability is what makes this trustworthy. If the worker dies halfway through the refunds, a new worker replays and finishes them.</p>
        <p>Honest cost: compensations are activities too. They need idempotency keys and they can fail. A refund that keeps failing needs a person, not an infinite retry.</p>
        <p>The code runs: examples/test_cases.py checks the undo order on Temporal's test server. The pattern is the 1987 Sagas paper, Garcia-Molina and Salem.</p>
      </SpeakerNote>
    </Slide>
  );
}

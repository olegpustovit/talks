export type ReplayCommand = {
  kind: "timer" | "activity";
  name: string;
  lines: number[];
  days?: number;
  arg?: string;
  result?: Record<string, unknown>;
};
export type ReplayEvent = {
  kind: "timer" | "activity";
  name: string;
  arg?: string;
  deadline?: number;
  result?: Record<string, unknown>;
};
export type ReplayState = {
  alive: boolean;
  worker: number;
  cursor: number;
  day: number;
  phase: "ready" | "waiting" | "executed" | "recorded";
  history: ReplayEvent[];
  effects: Record<string, number>;
  memory: string;
  status: string;
};
export type ReplayAction = "next" | "kill" | "restart" | "reset";
export const initialReplayState = (): ReplayState => ({
  alive: true, worker: 1, cursor: 0, day: 0, phase: "ready", history: [], effects: {},
  memory: "user_id = 'user-42'", status: "Start at the first wait.",
});

/** A deterministic teaching simulation. History and external effects outlive a worker. */
export function advanceReplay(state: ReplayState, action: ReplayAction, commands: ReplayCommand[]): ReplayState {
  if (action === "reset") return initialReplayState();
  if (action === "kill") return !state.alive ? state : {
    ...state, alive: false, memory: "∅", phase: "ready",
    status: "Worker killed. Memory is gone. History and external effects survive.",
  };
  if (action === "restart") return state.alive ? state : {
    ...state, alive: true, worker: state.worker + 1, cursor: 0, phase: "ready",
    memory: "user_id = 'user-42'", status: "A new worker starts the workflow from the top and replays history.",
  };
  if (!state.alive || state.cursor >= commands.length) return state;
  const command = commands[state.cursor]!;
  const saved = state.history[state.cursor];
  const next = { ...state };
  if (command.kind === "timer") {
    if (!saved) {
      const deadline = state.day + (command.days ?? 0);
      next.history = [...state.history, { kind: "timer", name: command.name, deadline }];
      next.phase = "waiting";
      next.status = `Deadline saved: day ${deadline}. Waiting.`;
    } else if (saved.deadline! > state.day && state.phase !== "waiting") {
      next.phase = "waiting";
      next.status = `Replay restores the same day ${saved.deadline} deadline. Still waiting.`;
    } else {
      next.day = Math.max(state.day, saved.deadline!);
      next.cursor += 1;
      next.phase = "ready";
      next.status = state.phase === "waiting" ? `Day ${next.day}. The wait is over.` : "Replay: this deadline has already passed.";
    }
  } else if (state.phase === "recorded") {
    next.cursor += 1;
    next.phase = "ready";
    next.memory = `result = ${JSON.stringify(saved!.result)}`;
    next.status = "The saved result goes back to the workflow.";
  } else if (saved) {
    next.cursor += 1;
    next.phase = "ready";
    next.memory = `result = ${JSON.stringify(saved.result)}`;
    next.status = `Replay ${command.name}: return the saved result. No new side effect.`;
  } else if (state.phase === "executed") {
    next.history = [...state.history, { kind: "activity", name: command.name, arg: command.arg, result: command.result }];
    next.phase = "recorded";
    next.status = "Result saved outside the worker.";
  } else {
    next.effects = { ...state.effects, [command.name]: (state.effects[command.name] ?? 0) + 1 };
    next.phase = "executed";
    next.memory = `pending result = ${JSON.stringify(command.result)}`;
    next.status = `${command.name} ran. Its result is only in memory.`;
  }
  if (next.cursor === commands.length) next.status += " Workflow complete.";
  return next;
}

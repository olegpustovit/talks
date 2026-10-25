import { describe, expect, test } from "bun:test";
import { advanceReplay, initialReplayState, type ReplayCommand } from "../src/components/executionReplayModel";
const commands: ReplayCommand[] = [
  { kind: "timer", name: "wait", days: 2, lines: [1] },
  { kind: "activity", name: "email", arg: "42", result: { sent: true }, lines: [2] },
];
function session() {
  let state = initialReplayState();
  return {
    act(action: Parameters<typeof advanceReplay>[1], count = 1) {
      for (let i = 0; i < count; i++) state = advanceReplay(state, action, commands);
      return state;
    },
  };
}
describe("worker crash and replay", () => {
  test("saved result restores memory without another effect", () => {
    const s = session();
    const recorded = s.act("next", 4);
    expect(recorded.phase).toBe("recorded");
    const killed = s.act("kill");
    expect(killed.memory).toBe("∅");
    expect(killed.history).toEqual(recorded.history);
    s.act("restart");
    const replayed = s.act("next", 2);
    expect(replayed.effects.email).toBe(1);
    expect(replayed.cursor).toBe(2);
    expect(replayed.memory).toContain('"sent":true');
    expect(s.act("next")).toEqual(replayed);
  });
  test("effect repeats when completion was never saved", () => {
    const s = session();
    expect(s.act("next", 3).effects.email).toBe(1);
    s.act("kill"); s.act("restart");
    expect(s.act("next", 2).effects.email).toBe(2);
  });
  test("pending timer retains its deadline across replacement", () => {
    const s = session();
    s.act("next"); s.act("kill");
    expect(s.act("next").day).toBe(0);
    s.act("restart");
    expect(s.act("next").history).toHaveLength(1);
    expect(s.act("next").day).toBe(2);
    expect(s.act("reset")).toEqual(initialReplayState());
  });
});

import runtime from "./examples/toy_runtime.py?raw";
import trial from "./examples/trial.py?raw";
import trialV2 from "./examples/trial_v2.py?raw";

export function snippet(source: string, name: string) {
  return source.split(`# snippet: ${name}\n`)[1]!.split(`# end: ${name}`)[0]!.trimEnd();
}
export const runtimeSnippet = (name: string) => snippet(runtime, name);
export const TRIAL_CODE = snippet(trial, "trial");
export const TRIAL_V2_CODE = snippet(trialV2, "trial_v2");
export const CHECKED_CODE = snippet(runtime, "checked");
export const IMPERATIVE_CODE = `def trial(user_id):
    time.sleep(2 * DAY)
    send_reminder(user_id)
    time.sleep(8 * DAY)
    send_tips(user_id)
    time.sleep(4 * DAY)
    expire_if_unpaid(user_id)`;

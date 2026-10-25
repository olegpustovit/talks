"""The code-change slide: trial_v2.py replaying Ada's day-11 history from trial.py.

python3 examples/test_change_code.py
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

DAY = 86_400
EXAMPLES = str(Path(__file__).parent.resolve())

# Ada on day 11 under trial.py: reminder on day 2, tips on day 10, waiting for day 14.
DAY_11_HISTORY = [
    {"sleep": 2 * DAY, "deadline": 2 * DAY},
    {"activity": "send_reminder", "result": {"sent": True}},
    {"sleep": 8 * DAY, "deadline": 10 * DAY},
    {"activity": "send_tips", "result": {"sent": True}},
    {"sleep": 4 * DAY, "deadline": 14 * DAY},
]

PROGRAM = f'''
import asyncio, sys
sys.path.insert(0, {EXAMPLES!r})
from unittest.mock import patch
import toy_runtime
if sys.argv[1] == "checked":
    toy_runtime.workflow = toy_runtime.CheckedWorkflow()
clock = [11 * {DAY}]
async def fake_sleep(seconds):
    clock[0] += seconds
with patch("toy_runtime.time.time", lambda: clock[0]), patch("toy_runtime.asyncio.sleep", fake_sleep):
    from trial_v2 import Trial
    asyncio.run(Trial().run("ada"))
'''


def replay(mode):
    with tempfile.TemporaryDirectory() as cwd:
        path = Path(cwd, "history.jsonl")
        path.write_text("".join(json.dumps(event) + "\n" for event in DAY_11_HISTORY))
        run = subprocess.run([sys.executable, "-c", PROGRAM, mode], cwd=cwd, capture_output=True, text=True)
        history = [json.loads(line) for line in path.read_text().splitlines()]
        return run, history


class ChangeCodeTest(unittest.TestCase):
    def test_unchecked_replay_goes_silently_wrong(self):
        run, history = replay("unchecked")
        self.assertEqual(run.returncode, 0, run.stderr)
        # send_nudge replayed send_tips's saved result: never sent.
        self.assertNotIn("nudge", run.stdout)
        # send_tips found no history at its new position: sent again, on day 14.
        self.assertEqual(run.stdout.count("EMAIL tips"), 1)
        self.assertEqual(history[5]["activity"], "send_tips")
        # The new sleep(4 days) starts on day 14: the trial ends on day 18.
        self.assertEqual(history[6]["deadline"], 18 * DAY)
        self.assertEqual(history[7]["activity"], "expire_if_unpaid")

    def test_checked_replay_stops_before_any_effect(self):
        run, history = replay("checked")
        self.assertNotEqual(run.returncode, 0)
        self.assertIn("NondeterminismError: history[3]", run.stderr)
        self.assertIn("code called send_nudge", run.stderr)
        self.assertNotIn("EMAIL", run.stdout)
        self.assertEqual(history, DAY_11_HISTORY)


if __name__ == "__main__":
    unittest.main()

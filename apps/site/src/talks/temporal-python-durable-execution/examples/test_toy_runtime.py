import asyncio
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import AsyncMock, patch

from toy_runtime import Workflow


class ToyRuntimeTest(unittest.TestCase):
    def test_recorded_result_survives_process_exit(self):
        runtime_dir = str(Path(__file__).parent.resolve())
        program = f'''
import sys, asyncio, os
sys.path.insert(0, {runtime_dir!r})
from datetime import timedelta
from toy_runtime import Workflow
async def email(user):
    print("SIDE EFFECT", flush=True)
    return {{"sent": True}}
async def main():
    result = await Workflow().execute_activity(email, "42", start_to_close_timeout=timedelta(seconds=1))
    print(result, flush=True)
asyncio.run(main())
os._exit(0)
'''
        with tempfile.TemporaryDirectory() as cwd:
            first = subprocess.check_output([sys.executable, "-c", program], cwd=cwd, text=True)
            second = subprocess.check_output([sys.executable, "-c", program], cwd=cwd, text=True)
            self.assertIn("SIDE EFFECT", first)
            self.assertNotIn("SIDE EFFECT", second)
            self.assertIn("'sent': True", second)
            self.assertEqual(len(Path(cwd, "history.jsonl").read_text().splitlines()), 1)

    def test_restart_uses_original_timer_deadline(self):
        with tempfile.TemporaryDirectory() as cwd:
            path = Path(cwd, "history.jsonl")
            with patch("toy_runtime.time.time", return_value=100), patch("toy_runtime.asyncio.sleep", new_callable=AsyncMock) as sleep:
                asyncio.run(Workflow(path).sleep(timedelta(seconds=10)))
                sleep.assert_awaited_once_with(10)
            with patch("toy_runtime.time.time", return_value=107), patch("toy_runtime.asyncio.sleep", new_callable=AsyncMock) as sleep:
                asyncio.run(Workflow(path).sleep(timedelta(seconds=10)))
                sleep.assert_awaited_once_with(3)
            self.assertEqual(len(path.read_text().splitlines()), 1)
            self.assertEqual(json.loads(path.read_text())["deadline"], 110)


if __name__ == "__main__":
    unittest.main()

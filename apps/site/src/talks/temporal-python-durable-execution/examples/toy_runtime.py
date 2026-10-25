"""One workflow, one worker, one JSON-lines history. Teaching code, not a scheduler."""
import asyncio
import json
import os
import time
from pathlib import Path

# snippet: init
class Workflow:
    def __init__(self, path="history.jsonl"):
        self.path = Path(path)
        self.history = []
        if self.path.exists():
            for line in self.path.read_text().splitlines():
                self.history.append(json.loads(line))
        self.cursor = 0
# end: init

# snippet: save
    def save(self, event):
        with self.path.open("a") as file:
            file.write(json.dumps(event) + "\n")
            file.flush()
            os.fsync(file.fileno())
        self.history.append(event)
# end: save

# snippet: execute_activity
    async def execute_activity(self, fn, arg, **options):
        if self.cursor < len(self.history):  # replay
            result = self.history[self.cursor]["result"]
        else:  # execute
            result = await fn(arg)
            self.save({"activity": fn.__name__, "result": result})
        self.cursor += 1
        return result
# end: execute_activity

# snippet: sleep
    async def sleep(self, duration):
        if self.cursor < len(self.history):  # replay
            deadline = self.history[self.cursor]["deadline"]
        else:  # execute
            deadline = time.time() + duration.total_seconds()
            self.save({"sleep": duration.total_seconds(), "deadline": deadline})
        self.cursor += 1
        await asyncio.sleep(max(0, deadline - time.time()))
# end: sleep

# snippet: decorators
    def defn(self, cls):
        return cls

    def run(self, fn):
        return fn
# end: decorators

# snippet: api
class Activity:
    def defn(self, fn):
        return fn


workflow = Workflow()
activity = Activity()
# end: api


# snippet: checked
class NondeterminismError(RuntimeError):
    pass


class CheckedWorkflow(Workflow):
    async def execute_activity(self, fn, arg, **options):
        if self.cursor < len(self.history):  # replay
            event = self.history[self.cursor]
            if event.get("activity") != fn.__name__:
                raise NondeterminismError(
                    f"history[{self.cursor}] is {event}, code called {fn.__name__}")
        return await super().execute_activity(fn, arg, **options)
# end: checked

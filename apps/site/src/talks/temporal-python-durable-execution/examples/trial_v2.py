"""trial.py after a product change: a nudge on day 7. Deployed while trials are running."""
from toy_runtime import activity, workflow
from trial import DAY, MINUTE, expire_if_unpaid, send_reminder, send_tips


@activity.defn
async def send_nudge(user_id: str) -> dict:
    from trial_effects import send_email
    return await send_email(user_id, "nudge")


# snippet: trial_v2
@workflow.defn
class Trial:
    @workflow.run
    async def run(self, user_id: str) -> None:
        await workflow.sleep(2 * DAY)
        await workflow.execute_activity(
            send_reminder, user_id, start_to_close_timeout=MINUTE)
        await workflow.sleep(5 * DAY)
        await workflow.execute_activity(
            send_nudge, user_id, start_to_close_timeout=MINUTE)
        await workflow.sleep(3 * DAY)
        await workflow.execute_activity(
            send_tips, user_id, start_to_close_timeout=MINUTE)
        await workflow.sleep(4 * DAY)
        await workflow.execute_activity(
            expire_if_unpaid, user_id, start_to_close_timeout=MINUTE)
# end: trial_v2

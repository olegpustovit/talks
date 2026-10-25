from datetime import timedelta
from toy_runtime import activity, workflow


@activity.defn
async def send_reminder(user_id: str) -> dict:
    from trial_effects import send_email
    return await send_email(user_id, "reminder")


@activity.defn
async def send_tips(user_id: str) -> dict:
    from trial_effects import send_email
    return await send_email(user_id, "tips")


@activity.defn
async def expire_if_unpaid(user_id: str) -> dict:
    from trial_effects import end_trial_if_unpaid
    return await end_trial_if_unpaid(user_id)


# snippet: trial
DAY = timedelta(days=1)
MINUTE = timedelta(minutes=1)


@workflow.defn
class Trial:
    @workflow.run
    async def run(self, user_id: str) -> None:
        await workflow.sleep(2 * DAY)
        await workflow.execute_activity(
            send_reminder, user_id, start_to_close_timeout=MINUTE)
        await workflow.sleep(8 * DAY)
        await workflow.execute_activity(
            send_tips, user_id, start_to_close_timeout=MINUTE)
        await workflow.sleep(4 * DAY)
        await workflow.execute_activity(
            expire_if_unpaid, user_id, start_to_close_timeout=MINUTE)
# end: trial

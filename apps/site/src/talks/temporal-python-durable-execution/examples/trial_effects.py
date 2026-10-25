"""Local stand-ins for the existing business I/O; no real email is sent."""
async def send_email(user_id, template):
    print(f"EMAIL {template} to {user_id}", flush=True)
    return {"sent": True}

async def end_trial_if_unpaid(user_id):
    print(f"CHECK PAYMENT / EXPIRE {user_id}", flush=True)
    return {"expired": True}

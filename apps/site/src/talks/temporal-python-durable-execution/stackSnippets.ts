export const SCHEMA = `create table users (
  id uuid primary key,
  email text not null,
  signup_at timestamptz not null,
  reminder_sent_at timestamptz,
  tips_sent_at timestamptz,
  trial_status text default 'trial'
);`;

export const CELERY = `@app.task
def send_trial_reminder(user_id):
    user = User.objects.get(id=user_id)
    mail.send("day-2", to=user.email)
    user.reminder_sent_at = timezone.now()
    user.save()`;

export const SQS = `def handle_sqs(event):
    user_id = event["user_id"]
    # send, then write sent_at
    send_trial_reminder.delay(user_id)`;

export const CRONTAB = `# catch anyone the worker missed
*/15 * * * *  /app/bin/trial_sweeper
0    * * * *  /app/bin/tips_sweeper
0    * * * *  /app/bin/expire_sweeper`;

export const SWEEPER = `select id from users
where signup_at < now() - interval '2 days'
  and reminder_sent_at is null
  and trial_status = 'trial'
limit 500;`;

export const SCHEMA_AFTER = `create table users (
  id uuid primary key,
  email text not null,
  signup_at timestamptz not null,
  reminder_sent_at timestamptz,
  reminder_attempts int default 0,
  reminder_last_error text,
  tips_sent_at timestamptz,
  tips_attempts int default 0,
  trial_status text default 'trial',
  locked_at timestamptz,
  lock_owner text,
  provider_message_id text
);`;

export const LOCK = `update users
set locked_at = now(), lock_owner = %s
where id = %s
  and locked_at is null
returning id;`;

export const RETRY = `@app.task
def retry_unacked_reminders():
    rows = User.objects.filter(
        reminder_sent_at__isnull=True,
        reminder_attempts__lt=5,
        locked_at__isnull=True,
        signup_at__lt=now() - timedelta(days=2),
    )[:200]
    for user in rows:
        send_trial_reminder.delay(user.id)`;

export const CHECKER = `def reconcile_sendgrid(since):
    for msg in sendgrid.messages(since=since):
        user = User.objects.filter(
            provider_message_id=msg.id
        ).first()
        if user is None and msg.status == "delivered":
            # sent, never written
            ...
        if user and msg.status == "bounce":
            ...`;

export const BEAT = `app.conf.beat_schedule = {
  "reminders": {"task": "sweep_reminders", "schedule": 900.0},
  "tips":      {"task": "sweep_tips",      "schedule": 3600.0},
  "expire":    {"task": "sweep_expire",    "schedule": 3600.0},
  "retry":     {"task": "retry_unacked",   "schedule": 300.0},
  "reconcile": {"task": "reconcile_sg",    "schedule": 600.0},
}`;

export const EXPIRE = `select id from users
where signup_at < now() - interval '14 days'
  and trial_status = 'trial'
  and not exists (
    select 1 from subscriptions s
    where s.user_id = users.id
      and s.status = 'active'
  )
for update skip locked;`;

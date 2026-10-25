"""Slides 13-25 on Temporal's time-skipping test server.

pip install temporalio pytest pytest-asyncio
cd examples && pytest test_cases.py
"""
import asyncio
import sys
import tempfile
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from temporalio import activity
from temporalio.client import WorkflowFailureError
from temporalio.common import WorkflowIDReusePolicy
from temporalio.exceptions import ApplicationError, WorkflowAlreadyStartedError
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

import cases

# Slide 13, literally: trial.py with only its import changed.
_generated = Path(tempfile.mkdtemp())
(_generated / "trial_temporal.py").write_text(
    Path(__file__).with_name("trial.py").read_text().replace(
        "from toy_runtime import", "from temporalio import"))
sys.path.insert(0, str(_generated))
from trial_temporal import Trial  # noqa: E402

sent: list[str] = []


# snippet: fake
@activity.defn(name="send_reminder")
async def fake_reminder(user_id: str) -> dict:
    sent.append("reminder")
    return {"sent": True}
# end: fake


@activity.defn(name="send_tips")
async def fake_tips(user_id: str) -> dict:
    sent.append("tips")
    return {"sent": True}


@activity.defn(name="expire_if_unpaid")
async def fake_expire(user_id: str) -> dict:
    sent.append("expire")
    return {"expired": True}


# snippet: test
@pytest.mark.asyncio
async def test_trial_lasts_14_days():
    env = await WorkflowEnvironment.start_time_skipping()
    async with env, Worker(
        env.client, task_queue="test", workflows=[Trial],
        activities=[fake_reminder, fake_tips, fake_expire],
    ):
        start = await env.get_current_time()
        await env.client.execute_workflow(
            Trial.run, "user-42",
            id="trial-42", task_queue="test")
        elapsed = await env.get_current_time() - start
    assert elapsed >= timedelta(days=14)
    assert sent == ["reminder", "tips", "expire"]
# end: test


calls: list[str] = []


def fake(name: str, result: Any = None, fail: bool = False):
    @activity.defn(name=name)
    async def run(arg: Any) -> Any:
        calls.append(name)
        if fail:
            raise ApplicationError(f"{name} failed", non_retryable=True)
        return result
    return run


@pytest.mark.asyncio
async def test_checkout_compensates_in_reverse():
    calls.clear()
    ok = ["reserve_inventory", "charge_payment", "cancel_shipment", "refund_payment", "release_inventory"]
    acts = [fake(name) for name in ok] + [fake("create_shipment", fail=True)]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.Checkout], activities=acts
    ):
        with pytest.raises(WorkflowFailureError):
            await env.client.execute_workflow(cases.Checkout.run, "order-1042", id="order-1042", task_queue="t")
    assert calls == [
        "reserve_inventory", "charge_payment", "create_shipment",
        "cancel_shipment", "refund_payment", "release_inventory",
    ]


@pytest.mark.asyncio
async def test_fulfillment_refunds_after_three_days_without_the_warehouse():
    calls.clear()
    names = ["reserve_inventory", "charge_payment", "refund_payment", "release_inventory"]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.Fulfillment], activities=[fake(name) for name in names]
    ):
        start = await env.get_current_time()
        result = await env.client.execute_workflow(cases.Fulfillment.run, "order-1042", id="order-1042", task_queue="t")
        elapsed = await env.get_current_time() - start
    assert result == "refunded"
    assert elapsed >= timedelta(days=3)
    assert calls == ["reserve_inventory", "charge_payment", "refund_payment", "release_inventory"]


@pytest.mark.asyncio
async def test_fulfillment_ships_when_the_warehouse_signals():
    calls.clear()
    names = ["reserve_inventory", "charge_payment", "refund_payment", "release_inventory"]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.Fulfillment], activities=[fake(name) for name in names]
    ):
        handle = await env.client.start_workflow(cases.Fulfillment.run, "order-1043", id="order-1043", task_queue="t")
        await handle.signal(cases.Fulfillment.warehouse_shipped)
        assert await handle.result() == "shipped"
    assert calls == ["reserve_inventory", "charge_payment"]


@pytest.mark.asyncio
async def test_webhook_duplicate_event_is_rejected():
    acts = [fake("fetch_event", {}), fake("grant_access"), fake("send_receipt")]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.HandlePayment], activities=acts
    ):
        start = dict(id="stripe-evt_1", task_queue="t", id_reuse_policy=WorkflowIDReusePolicy.REJECT_DUPLICATE)
        await env.client.execute_workflow(cases.HandlePayment.run, "evt_1", **start)
        with pytest.raises(WorkflowAlreadyStartedError):
            await env.client.start_workflow(cases.HandlePayment.run, "evt_1", **start)
        # The default policy would reuse a closed workflow's ID and run the event again.
        await env.client.execute_workflow(cases.HandlePayment.run, "evt_1", id="stripe-evt_1", task_queue="t")


@pytest.mark.asyncio
async def test_documents_retry_only_the_rate_limited_page():
    attempts: dict[str, int] = {}

    @activity.defn(name="split_pdf")
    async def split(pdf_key: str) -> list[str]:
        return [f"p{n}" for n in range(1, 21)]

    @activity.defn(name="summarize_page")
    async def summarize(key: str) -> str:
        attempts[key] = attempts.get(key, 0) + 1
        if key == "p7" and attempts[key] == 1:
            raise ApplicationError("429 Too Many Requests")
        return f"summary of {key}"

    @activity.defn(name="combine_summaries")
    async def combine(summaries: list[str]) -> str:
        return f"{len(summaries)} summaries"

    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.SummarizeDocument], activities=[split, summarize, combine]
    ):
        result = await env.client.execute_workflow(cases.SummarizeDocument.run, "report.pdf", id="doc-1", task_queue="t")
    assert result == "20 summaries"
    assert attempts["p7"] == 2
    assert all(count == 1 for key, count in attempts.items() if key != "p7")


@pytest.mark.asyncio
async def test_review_escalates_then_accepts_a_decision():
    calls.clear()
    acts = [fake("open_review_ticket"), fake("escalate_to_lead")]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.KycReview], activities=acts
    ):
        handle = await env.client.start_workflow(cases.KycReview.run, "A-2291", id="kyc-A-2291", task_queue="t")
        await env.sleep(timedelta(hours=49))
        for _ in range(100):
            if "escalate_to_lead" in calls:
                break
            await asyncio.sleep(0.05)
        assert "escalate_to_lead" in calls
        assert await handle.execute_update(cases.KycReview.decide, "approved") == "approved"
        assert await handle.result() == "approved"


@pytest.mark.asyncio
async def test_tenant_provisioning_waits_for_the_certificate():
    acts = [fake("create_database"), fake("create_dns_record"), cases.wait_for_certificate, fake("seed_tenant")]
    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.ProvisionTenant], activities=acts
    ):
        result = await env.client.execute_workflow(
            cases.ProvisionTenant.run, cases.Tenant("acme", "acme.shop.app"), id="tenant-acme", task_queue="t")
    assert result == "https://acme.shop.app"


@pytest.mark.asyncio
async def test_crm_sync_carries_the_cursor_across_continue_as_new():
    fetched: list[str | None] = []

    @activity.defn(name="fetch_and_upsert_page")
    async def fetch(account_id: str, cursor: str | None) -> cases.Page:
        fetched.append(cursor)
        n = 0 if cursor is None else int(cursor[1:])
        return cases.Page(count=100, next_cursor=None if n == 248 else f"c{n + 1}")

    async with await WorkflowEnvironment.start_time_skipping() as env, Worker(
        env.client, task_queue="t", workflows=[cases.CrmSync], activities=[fetch]
    ):
        result = await env.client.execute_workflow(cases.CrmSync.run, cases.SyncInput("acme"), id="crm-acme", task_queue="t")
    assert result == 24_900
    assert len(fetched) == 249
    assert fetched[200] == "c200"

"""Case-study workflows behind slides 14, 21 and the cut list. Activities here are stand-ins; test_cases.py registers fakes."""
import asyncio
from dataclasses import dataclass
from datetime import timedelta

from temporalio import activity, workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

# snippet: opts
opts = dict(start_to_close_timeout=timedelta(minutes=1))
# end: opts


@activity.defn
async def reserve_inventory(order_id: str) -> None: ...


@activity.defn
async def release_inventory(order_id: str) -> None: ...


@activity.defn
async def charge_payment(order_id: str) -> None: ...


@activity.defn
async def refund_payment(order_id: str) -> None: ...


@activity.defn
async def create_shipment(order_id: str) -> None: ...


@activity.defn
async def cancel_shipment(order_id: str) -> None: ...


@workflow.defn
class Checkout:
    # snippet: checkout
    @workflow.run
    async def run(self, order_id: str) -> str:
        undo = []
        try:
            undo.append(release_inventory)
            await workflow.execute_activity(
                reserve_inventory, order_id, **opts)
            undo.append(refund_payment)
            await workflow.execute_activity(
                charge_payment, order_id, **opts)
            undo.append(cancel_shipment)
            await workflow.execute_activity(
                create_shipment, order_id, **opts)
            return "shipped"
        except ActivityError:
            for compensate in reversed(undo):
                await workflow.execute_activity(
                    compensate, order_id, **opts)
            raise
    # end: checkout


# snippet: fulfillment
@workflow.defn
class Fulfillment:
    def __init__(self) -> None:
        self.shipped = False

    @workflow.signal
    def warehouse_shipped(self) -> None:
        self.shipped = True

    @workflow.run
    async def run(self, order_id: str) -> str:
        undo = []
        try:
            undo.append(release_inventory)
            await workflow.execute_activity(
                reserve_inventory, order_id, **opts)
            undo.append(refund_payment)
            await workflow.execute_activity(
                charge_payment, order_id, **opts)
            await workflow.wait_condition(
                lambda: self.shipped, timeout=timedelta(days=3))
            return "shipped"
        except (ActivityError, asyncio.TimeoutError):
            for compensate in reversed(undo):
                await workflow.execute_activity(
                    compensate, order_id, **opts)
            return "refunded"
# end: fulfillment


@activity.defn
async def fetch_event(event_id: str) -> dict: ...


@activity.defn
async def grant_access(event_id: str) -> None: ...


@activity.defn
async def send_receipt(event_id: str) -> None: ...


@workflow.defn
class HandlePayment:
    @workflow.run
    async def run(self, event_id: str) -> None:
        await workflow.execute_activity(fetch_event, event_id, **opts)
        await workflow.execute_activity(grant_access, event_id, **opts)
        await workflow.execute_activity(send_receipt, event_id, **opts)


@activity.defn
async def split_pdf(pdf_key: str) -> list[str]: ...


@activity.defn
async def summarize_page(page_key: str) -> str: ...


@activity.defn
async def combine_summaries(summaries: list[str]) -> str: ...


# snippet: llm
llm = dict(
    start_to_close_timeout=timedelta(minutes=2),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=5)))
# end: llm


@workflow.defn
class SummarizeDocument:
    # snippet: documents
    @workflow.run
    async def run(self, pdf_key: str) -> str:
        pages = await workflow.execute_activity(
            split_pdf, pdf_key, **opts)
        summaries = []
        for i in range(0, len(pages), 10):
            summaries += await asyncio.gather(*(
                workflow.execute_activity(
                    summarize_page, key, **llm)
                for key in pages[i:i + 10]))
        return await workflow.execute_activity(
            combine_summaries, summaries, **llm)
    # end: documents


@activity.defn
async def open_review_ticket(applicant_id: str) -> None: ...


@activity.defn
async def escalate_to_lead(applicant_id: str) -> None: ...


# snippet: review
@workflow.defn
class KycReview:
    def __init__(self) -> None:
        self.decision: str | None = None

    @workflow.update
    def decide(self, decision: str) -> str:
        self.decision = decision
        return decision

    @workflow.run
    async def run(self, applicant_id: str) -> str:
        await workflow.execute_activity(
            open_review_ticket, applicant_id, **opts)
        while self.decision is None:
            try:
                await workflow.wait_condition(
                    lambda: self.decision is not None,
                    timeout=timedelta(hours=48))
            except asyncio.TimeoutError:
                await workflow.execute_activity(
                    escalate_to_lead, applicant_id, **opts)
        return self.decision
# end: review


@dataclass
class Tenant:
    slug: str
    domain: str


class certs:
    """Stand-in certificate client; a real one asks the certificate authority."""

    @staticmethod
    async def is_issued(domain: str) -> bool:
        return True


@activity.defn
async def create_database(t: Tenant) -> None: ...


@activity.defn
async def create_dns_record(t: Tenant) -> None: ...


@activity.defn
async def seed_tenant(t: Tenant) -> None: ...


# snippet: certificate
@activity.defn
async def wait_for_certificate(t: Tenant) -> None:
    while not await certs.is_issued(t.domain):
        activity.heartbeat()
        await asyncio.sleep(30)
# end: certificate


@workflow.defn
class ProvisionTenant:
    # snippet: tenant
    @workflow.run
    async def run(self, t: Tenant) -> str:
        await workflow.execute_activity(
            create_database, t, **opts)
        await workflow.execute_activity(
            create_dns_record, t, **opts)
        await workflow.execute_activity(
            wait_for_certificate, t,
            start_to_close_timeout=timedelta(hours=1),
            heartbeat_timeout=timedelta(minutes=2))
        await workflow.execute_activity(
            seed_tenant, t, **opts)
        return f"https://{t.domain}"
    # end: tenant


@dataclass
class SyncInput:
    account_id: str
    cursor: str | None = None
    synced: int = 0


@dataclass
class Page:
    count: int
    next_cursor: str | None


@activity.defn
async def fetch_and_upsert_page(account_id: str, cursor: str | None) -> Page: ...


@workflow.defn
class CrmSync:
    # snippet: sync
    @workflow.run
    async def run(self, inp: SyncInput) -> int:
        cursor, synced = inp.cursor, inp.synced
        for _ in range(200):
            page = await workflow.execute_activity(
                fetch_and_upsert_page,
                args=[inp.account_id, cursor], **opts)
            synced += page.count
            if page.next_cursor is None:
                return synced
            cursor = page.next_cursor
        workflow.continue_as_new(
            SyncInput(inp.account_id, cursor, synced))
    # end: sync

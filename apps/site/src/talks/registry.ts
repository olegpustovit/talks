import type { ComponentType } from "react";
import { App as RubyOnLambda } from "./ruby-on-lambda/App";
import { App as TemporalPythonDurableExecution } from "./temporal-python-durable-execution/App";

export type TalkEntry = {
  slug: string;
  title: string;
  event?: string;
  summary: string;
  component: ComponentType;
};

/** Talks listed on the site index. Add a row here when scaffolding a new deck. */
export const talks: TalkEntry[] = [
  {
    slug: "ruby-on-lambda",
    title: "Running Ruby apps on AWS Lambda",
    event: "RubyZG · 22 October 2026",
    summary: "Follow a small Ruby API through Lambda, the Rack bridge, application infrastructure and an ahead-of-time compiler experiment.",
    component: RubyOnLambda,
  },
  {
    slug: "temporal-python-durable-execution",
    title: "Durable Python: from running custom SQS workers and Celery to Temporal",
    // Date: https://www.meetup.com/python-hrvatska/events/316481848/
    event: "Python Zagreb · 15 September 2026",
    summary:
      "Start from a cron-based 14-day trial, then show what the same feature looks like when a process can survive a restart without losing its place.",
    component: TemporalPythonDurableExecution,
  },
];

export function talkBySlug(slug: string): TalkEntry | undefined {
  return talks.find((talk) => talk.slug === slug);
}

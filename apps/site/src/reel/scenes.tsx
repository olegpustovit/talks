import type { ReactNode } from "react";
import { Offer } from "../talks/ruby-on-lambda/slides/companions/Offer";
import { ColdStart } from "../talks/ruby-on-lambda/slides/companions/ColdStart";
import { Concurrency } from "../talks/ruby-on-lambda/slides/companions/Concurrency";
import { Temptation } from "../talks/ruby-on-lambda/slides/companions/Temptation";
import { RackContract } from "../talks/ruby-on-lambda/slides/companions/RackContract";
import { EventToEnv } from "../talks/ruby-on-lambda/slides/companions/EventToEnv";
import { Mapper } from "../talks/ruby-on-lambda/slides/companions/Mapper";
import { HandlerApp } from "../talks/ruby-on-lambda/slides/companions/HandlerApp";
import { UnderTheHood } from "../talks/ruby-on-lambda/slides/companions/UnderTheHood";
import { Ecosystem } from "../talks/ruby-on-lambda/slides/companions/Ecosystem";
import { Tooling } from "../talks/ruby-on-lambda/slides/companions/Tooling";
import { AgentDeploy } from "../talks/ruby-on-lambda/slides/companions/AgentDeploy";
import { WhenToUse } from "../talks/ruby-on-lambda/slides/companions/WhenToUse";
import { Tailnet } from "../talks/ruby-on-lambda/slides/companions/Tailnet";
import { Spinel } from "../talks/ruby-on-lambda/slides/companions/Spinel";
import { HomeBrain } from "../talks/ruby-on-lambda/slides/companions/HomeBrain";
import { Network } from "../talks/ruby-on-lambda/slides/companions/Network";
import { Ingestion } from "../talks/ruby-on-lambda/slides/companions/Ingestion";
import { RackRds } from "../talks/ruby-on-lambda/slides/companions/RackRds";
import { BareHandler } from "../talks/ruby-on-lambda/slides/companions/BareHandler";
import { ImagePipeline } from "../talks/ruby-on-lambda/slides/companions/ImagePipeline";
import { AlertAgent } from "../talks/ruby-on-lambda/slides/companions/AlertAgent";

export type SceneArgs = { t: number; step: number; since: number };
export const SCENES: Record<string, (a: SceneArgs) => ReactNode> = {
  Offer: (a) => <Offer t={a.t} step={a.step} />,
  ColdStart: (a) => <ColdStart {...a} />,
  Concurrency: (a) => <Concurrency {...a} />,
  Temptation: (a) => <Temptation t={a.t} />,
  RackContract: (a) => <RackContract {...a} />,
  EventToEnv: (a) => <EventToEnv t={a.t} />,
  Mapper: (a) => <Mapper {...a} />,
  HandlerApp: (a) => <HandlerApp t={a.t} />,
  UnderTheHood: (a) => <UnderTheHood {...a} />,
  Ecosystem: (a) => <Ecosystem {...a} />,
  Tooling: (a) => <Tooling {...a} />,
  AgentDeploy: (a) => <AgentDeploy t={a.t} />,
  WhenToUse: (a) => <WhenToUse {...a} />,
  Tailnet: (a) => <Tailnet {...a} />,
  Spinel: (a) => <Spinel {...a} />,
  HomeBrain: (a) => <HomeBrain {...a} />,
  Network: (a) => <Network t={a.t} step={a.step} />,
  Ingestion: (a) => <Ingestion t={a.t} />,
  RackRds: (a) => <RackRds t={a.t} />,
  BareHandler: (a) => <BareHandler {...a} />,
  ImagePipeline: (a) => <ImagePipeline t={a.t} />,
  AlertAgent: (a) => <AlertAgent t={a.t} />,
};

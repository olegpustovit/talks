import { Deck } from "@talks/slide-engine";
import { talkTheme } from "./theme";
import "./talk.css";
import { DesignSystem } from "./DesignSystem";
import { TitleSlide } from "./slides/Title";
import { AboutSlide } from "./slides/About";
import { NeedsAComputerSlide } from "./slides/NeedsAComputer";
import { FreeComputersSlide } from "./slides/FreeComputers";
import { Slide02Slide } from "./slides/Slide02";
import { RailsOnLambdaSlide } from "./slides/RailsOnLambda";
import { ColdStartSlide } from "./slides/ColdStartSlide";
import { EveryCopySlide } from "./slides/EveryCopySlide";
import { BackToBasicsSlide } from "./slides/BackToBasics";
import { RackContractSlide } from "./slides/RackContract";
import { EventToEnvSlide } from "./slides/EventToEnvSlide";
import { MapperSlide } from "./slides/Mapper";
import { HandlerAppSlide } from "./slides/HandlerApp";
import { UnderTheHoodSlide } from "./slides/UnderTheHood";
import { EcosystemSlide } from "./slides/Ecosystem";
import { ToolingSlide } from "./slides/Tooling";
import { AgentDeploySlide } from "./slides/AgentDeploy";
import { WhenToUseSlide } from "./slides/WhenToUse";
import { BonusSlide } from "./slides/Bonus";
import { TailnetSlide } from "./slides/TailnetSlide";
import { HomeBrainSlide } from "./slides/HomeBrainSlide";
import { SpinelSlide } from "./slides/SpinelSlide";
import { ClosingSlide } from "./slides/Closing";

export function App() {
  return (
    <Deck title="Running Ruby apps on AWS Lambda" theme={talkTheme} designSystem={<DesignSystem />}>
      <TitleSlide />
      <AboutSlide />
      <NeedsAComputerSlide />
      <FreeComputersSlide />
      <Slide02Slide />
      <RailsOnLambdaSlide />
      <ColdStartSlide />
      <EveryCopySlide />
      <BackToBasicsSlide />
      <RackContractSlide />
      <EventToEnvSlide />
      <MapperSlide />
      <HandlerAppSlide />
      <UnderTheHoodSlide />
      <EcosystemSlide />
      <ToolingSlide />
      <AgentDeploySlide />
      <WhenToUseSlide />
      <BonusSlide fullBleed />
      <TailnetSlide />
      <SpinelSlide />
      <HomeBrainSlide />
      <ClosingSlide />
    </Deck>
  );
}

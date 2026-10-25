import { Deck } from "@talks/slide-engine";
import { talkTheme } from "./theme";
import "./talk.css";
import { TitleSlide } from "./slides/Title";
import { Slide02Slide } from "./slides/Slide02";
import { Slide03Slide } from "./slides/Slide03";
import { Slide04Slide } from "./slides/Slide04";
import { Slide05Slide } from "./slides/Slide05";
import { Slide06Slide } from "./slides/Slide06";
import { Slide07Slide } from "./slides/Slide07";
import { Slide08Slide } from "./slides/Slide08";
import { Slide09Slide } from "./slides/Slide09";
import { Slide10Slide } from "./slides/Slide10";
import { Slide11Slide } from "./slides/Slide11";
import { Slide12Slide } from "./slides/Slide12";
import { Slide13Slide } from "./slides/Slide13";
import { Slide14Slide } from "./slides/Slide14";
import { Slide15Slide } from "./slides/Slide15";
import { Slide16Slide } from "./slides/Slide16";
import { Slide17Slide } from "./slides/Slide17";
import { Slide18Slide } from "./slides/Slide18";
import { Slide19Slide } from "./slides/Slide19";
import { Slide20Slide } from "./slides/Slide20";
import { Slide21Slide } from "./slides/Slide21";
import { Slide22Slide } from "./slides/Slide22";
import { Slide23Slide } from "./slides/Slide23";
import { ClosingSlide } from "./slides/Closing";

export function App() {
  return (
    <Deck title="Running Ruby apps on AWS Lambda" theme={talkTheme}>
      <TitleSlide />
      <Slide02Slide />
      <Slide03Slide />
      <Slide04Slide />
      <Slide05Slide />
      <Slide06Slide />
      <Slide07Slide />
      <Slide08Slide />
      <Slide09Slide />
      <Slide10Slide />
      <Slide11Slide />
      <Slide12Slide />
      <Slide13Slide />
      <Slide14Slide />
      <Slide15Slide />
      <Slide16Slide />
      <Slide17Slide />
      <Slide18Slide />
      <Slide19Slide />
      <Slide20Slide />
      <Slide21Slide />
      <Slide22Slide />
      <Slide23Slide />
      <ClosingSlide />
    </Deck>
  );
}

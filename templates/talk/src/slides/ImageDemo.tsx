import { Slide, SlideImage, SpeakerNote } from "@talks/slide-engine";
import placeholder from "../assets/placeholder.svg";

export function ImageDemoSlide() {
  return (
    <Slide title="Images, zoomable" kicker="Assets">
      <SlideImage
        src={placeholder}
        alt="Placeholder figure — replace with a real diagram or screenshot"
        caption="Fig. 01 — click any figure to zoom. Swap this asset in src/assets/."
      />
      <SpeakerNote>
        <p>Replace this SVG with a real diagram before the talk.</p>
      </SpeakerNote>
    </Slide>
  );
}

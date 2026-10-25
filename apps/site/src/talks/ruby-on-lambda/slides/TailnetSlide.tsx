import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Tailnet } from "./companions/Tailnet";

export function TailnetSlide() {
  return (
    <Slide title={"A Lambda can join your home network"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-tailnet">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"20 / Bonus: your own internet"}</p>
          <h2>{"A Lambda can join your home network"}</h2>
          <p className="ruby-subtitle">{"With Tailscale inside the function, a public URL can reach the Pi, the NAS and Home Assistant at home. You rent no server and open no port on the router."}</p>
          <p className="ruby-footnote">{"* Tailscale doesn't publish cold-start numbers for Lambda. I'd measure Init Duration with and without it."}</p>
        </div>
        <SteppedScene cues={["A phone reaches Home Assistant through a Lambda", "Inside one copy: Tailscale in userspace", "The catches"]} still={9} wideFrom={1}>
          {(t, step, since) => <Tailnet t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"First bonus: serverless into your own network. Tailscale builds a private WireGuard network between your devices, your tailnet. A Lambda function can join it."}</p>
        <p>{"Watch the loop. I'm away from home and tap Start vacuum on my phone. It hits the Function URL. A Lambda copy wakes up, and it's a node on my tailnet, so it can talk to Home Assistant at home by name. Home Assistant starts the robot vacuum, and the reply goes back the same way. No server rented, no port opened on my router."}</p>
        <p>{"Press. Inside one copy. Lambda has no tun device, so Tailscale runs in userspace networking mode with its state in memory, which makes the node ephemeral. It offers a SOCKS5 proxy and, on the same port, an HTTP proxy, and that matters for us: Ruby's Net::HTTP has no SOCKS support, but it takes an HTTP proxy as two extra arguments. MagicDNS names like homeassistant resolve through the proxy. You can also skip the shell script: there's a Tailscale Lambda extension that joins the tailnet during init."}</p>
        <p>{"Press. What it costs. The cold start grows, because tailscaled has to start and log in inside the ten-second init budget; Tailscale publishes no numbers, so measure. Connections start relayed through Tailscale's DERP servers and may stay relayed from behind Lambda's NAT, which adds latency. Every concurrent copy is another ephemeral node, and the free plan has a thousand ephemeral minutes a month. Between requests the copy is frozen, so the first request after a thaw may wait for the tunnel. And the big one: a Function URL with auth NONE can be called by anyone who has it. Check a signature in Ruby before that URL can start anything in your house. Tag the auth key and let that tag reach only Home Assistant's port."}</p>
        <p>{"If you just want to expose one home service, Tailscale Funnel does it without any Lambda. The Lambda is for when you want Ruby in front: validation, webhooks, cron."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"The traced request: phone, Function URL, Lambda, tailnet, Home Assistant."}</li>
          <li>{"The bootstrap and the Ruby handler."}</li>
          <li>{"Six gotchas."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://tailscale.com/kb/1113/aws-lambda" target="_blank" rel="noopener noreferrer">{"Tailscale on AWS Lambda"}</a> · <a href="https://tailscale.com/kb/1112/userspace-networking" target="_blank" rel="noopener noreferrer">{"Userspace networking"}</a> · <a href="https://tailscale.com/kb/1111/ephemeral-nodes" target="_blank" rel="noopener noreferrer">{"Ephemeral nodes"}</a></p>
        <p><a href="https://tailscale.com/kb/1257/connection-types" target="_blank" rel="noopener noreferrer">{"Direct and relayed connections"}</a> · <a href="https://tailscale.com/pricing" target="_blank" rel="noopener noreferrer">{"Pricing"}</a> · <a href="https://tailscale.com/kb/1223/funnel" target="_blank" rel="noopener noreferrer">{"Funnel"}</a></p>
        <p><a href="https://dev.to/aws-heroes/using-tailscale-on-lambda-for-a-live-development-proxy-3hkc" target="_blank" rel="noopener noreferrer">{"Tailscale Lambda extension for Ruby"}</a> · <a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html" target="_blank" rel="noopener noreferrer">{"Function URL auth"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}

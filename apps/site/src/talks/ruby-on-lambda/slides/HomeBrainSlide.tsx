import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { HomeBrain } from "./companions/HomeBrain";

export function HomeBrainSlide() {
  return (
    <Slide title={"An assistant can run your house through one Lambda"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-brain">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"22 / Bonus: the home brain"}</p>
          <h2>{"An assistant can run your house through one Lambda"}</h2>
          <p className="ruby-subtitle">{"A Ruby MCP server runs on Lambda and sits on your tailnet. ChatGPT or Claude calls its tools, and the tools reach your home. You still approve anything that moves."}</p>
          <p className="ruby-footnote">{"* MCP is the Model Context Protocol. A model calls your tools over HTTP, and the spec says a person should be able to refuse any call."}</p>
        </div>
        <SteppedScene cues={["Sensors, tools, decisions", "The server: the mcp gem on Rack", "Before you connect it"]} still={6.5} wideFrom={1}>
          {(t, step, since) => <HomeBrain t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Last bonus, and the most sci-fi one. MCP, the Model Context Protocol, is how ChatGPT and Claude call tools over HTTP. The tools can be a Ruby Lambda. And with the previous slide, that Lambda is on my tailnet, so the tools reach my house."}</p>
        <p>{"This is laid out like the Mark I Perceptron figure. Sensory units on the left: the house. Association units in the middle: the tools. Response units on the right: the assistant, and a one-or-zero switch on every tool that changes something."}</p>
        <p>{"Watch it. I say I'm heading out. The assistant reads the front door sensor: unlocked. It asks to lock the door, I approve, the switch flips to one. It asks to turn off the lights, I approve. It asks to start the robot vacuum while I'm out, I approve. It reports back. Every wire that lights up is one tool call."}</p>
        <p>{"Press. The server is the official mcp gem, plain Rack. A tool is a class with a name, a description and an input schema; I use enums so the model can only pick doors that exist. The transport runs stateless with JSON responses, so no streaming, which the managed Ruby runtime can't do anyway. One gotcha I hit: the transport rejects unknown Host headers by default, so on a Function URL you have to set allowed_hosts."}</p>
        <p>{"Press. Before you connect it. The URL is public and ChatGPT can't sign IAM requests, so use OAuth, or check its client certificate or IP ranges. Writes ask for confirmation; only read-only tools skip it, so never mark a lock as read-only. Allow-lists, not free text, because prompt injection is real. The cold start is a chain: container, tailscale up, Ruby. And honestly, if the house is all you want, Home Assistant ships its own MCP server, and OpenAI has a tunnel that skips the Lambda entirely. The Lambda earns its place when you want your own Ruby in the middle."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"The wiring and the conversation."}</li>
          <li>{"The Ruby server."}</li>
          <li>{"Six gotchas."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://modelcontextprotocol.io/specification/2026-07-28/server/tools" target="_blank" rel="noopener noreferrer">{"MCP tools spec"}</a> · <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization" target="_blank" rel="noopener noreferrer">{"MCP authorization"}</a></p>
        <p><a href="https://rubygems.org/gems/mcp" target="_blank" rel="noopener noreferrer">{"mcp gem"}</a> · <a href="https://ruby.sdk.modelcontextprotocol.io/server/transports/" target="_blank" rel="noopener noreferrer">{"Ruby SDK transports"}</a></p>
        <p><a href="https://developers.openai.com/api/docs/guides/custom-mcp-server.md" target="_blank" rel="noopener noreferrer">{"ChatGPT custom MCP servers"}</a> · <a href="https://support.claude.com/en/articles/11175166" target="_blank" rel="noopener noreferrer">{"Claude custom connectors"}</a></p>
        <p><a href="https://www.home-assistant.io/integrations/mcp_server/" target="_blank" rel="noopener noreferrer">{"Home Assistant MCP Server"}</a> · <a href="https://developers.openai.com/api/docs/guides/secure-mcp-tunnels.md" target="_blank" rel="noopener noreferrer">{"OpenAI Secure MCP Tunnel"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}

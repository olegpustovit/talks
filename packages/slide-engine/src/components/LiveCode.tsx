import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { Button } from "./Button";

const MESSAGE_SOURCE = "slide-engine-live-code";

function sandboxDocument(code: string): string {
  return `<!doctype html><html><body><script>
    const send = (line) => parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, line }, "*");
    for (const method of ["log", "warn", "error"]) {
      const original = console[method];
      console[method] = (...args) => {
        send(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
        original?.(...args);
      };
    }
    try {
      (0, eval)(${JSON.stringify(code)});
    } catch (err) {
      send("Uncaught: " + err.message);
    }
  <\/script></body></html>`;
}

export interface LiveCodeProps {
  code: string;
  runLabel?: string;
}

/** An editable JS snippet with a Run button, executed in a sandboxed iframe. */
export function LiveCode({ code, runLabel = "Run ▸" }: LiveCodeProps) {
  const [current, setCurrent] = useState(code);
  const [output, setOutput] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.source !== MESSAGE_SOURCE) return;
      setOutput((prev) => [...prev, event.data.line]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function run() {
    setOutput([]);
    if (iframeRef.current) iframeRef.current.srcdoc = sandboxDocument(current);
  }

  return (
    <div className="flex flex-col gap-3">
      <CodeEditor code={code} language="javascript" onChange={setCurrent} />
      <div className="flex justify-end">
        <Button onClick={run}>{runLabel}</Button>
      </div>
      <pre
        className="m-0 min-h-[2.5em] bg-fg px-4 py-3 font-mono text-[0.9rem] whitespace-pre-wrap text-bg"
        style={{ borderRadius: "var(--se-radius)" }}
      >
        {output.length > 0 ? output.join("\n") : "Output will appear here."}
      </pre>
      <iframe ref={iframeRef} title="live-code-sandbox" sandbox="allow-scripts" style={{ display: "none" }} />
    </div>
  );
}

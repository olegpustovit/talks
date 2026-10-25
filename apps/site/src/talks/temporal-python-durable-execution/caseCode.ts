import cases from "./examples/cases.py?raw";
import tests from "./examples/test_cases.py?raw";
import { snippet } from "./runtimeSnippets";

function dedent(text: string): string {
  const lines = text.split("\n");
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length));
  return lines.map((line) => line.slice(indent)).join("\n");
}

export const caseSnippet = (name: string) => dedent(snippet(cases, name));
export const testSnippet = (name: string) => dedent(snippet(tests, name));

/** `count` 1-based line numbers, starting `offset` lines from the first line containing `needle`. */
export function at(code: string, needle: string, count = 1, offset = 0): number[] {
  const index = code.split("\n").findIndex((line) => line.includes(needle));
  if (index < 0) throw new Error(`"${needle}" is not in the snippet`);
  return Array.from({ length: count }, (_, i) => index + 1 + offset + i);
}

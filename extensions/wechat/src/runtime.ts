import type { OpenClawRuntime } from "openclaw/plugin-sdk";

let runtime: OpenClawRuntime | null = null;

export function setWeChatRuntime(r: OpenClawRuntime): void {
  runtime = r;
}

export function getWeChatRuntime(): OpenClawRuntime {
  if (!runtime) {
    throw new Error("WeChat runtime not initialized");
  }
  return runtime;
}

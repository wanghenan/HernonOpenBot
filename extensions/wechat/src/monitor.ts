import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { WeChatConfig } from "./config-schema.js";
import type { ResolvedWeChatAccount } from "./accounts.js";

export interface MonitorContext {
  account: ResolvedWeChatAccount;
  config: OpenClawConfig;
  runtime: {
    setStatus: (patch: Record<string, unknown>) => void;
    emitEvents?: (events: unknown[]) => void;
    log?: {
      info: (msg: string) => void;
      error: (msg: string) => void;
      warn: (msg: string) => void;
    };
  };
  abortSignal: AbortSignal;
  useWebhook: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookPath: string;
  statusSink: (patch: Record<string, unknown>) => void;
}

/**
 * 监控微信服务
 * Monitor WeChat service
 */
export async function monitorWeChatProvider(params: MonitorContext): Promise<void> {
  const { account, abortSignal, statusSink } = params;

  statusSink({ running: true, lastStartAt: new Date().toISOString() });

  if (params.useWebhook) {
    // Webhook mode - register webhook endpoint
    await setupWebhook(params);
  } else {
    // Polling mode - periodically check for messages
    await pollMessages(params);
  }

  statusSink({ running: false, lastStopAt: new Date().toISOString() });
}

async function setupWebhook(ctx: MonitorContext): Promise<void> {
  const { webhookUrl, webhookPath, webhookSecret, runtime, abortSignal } = ctx;

  // In webhook mode, the gateway handles incoming requests
  // This function would register the webhook with WeChat servers
  runtime.log?.info(`WeChat webhook mode enabled at ${webhookUrl}${webhookPath}`);

  // Keep the monitor alive until abort
  await new Promise<void>((resolve) => {
    const checkAbort = setInterval(() => {
      if (abortSignal.aborted) {
        clearInterval(checkAbort);
        resolve();
      }
    }, 1000);
  });
}

async function pollMessages(ctx: MonitorContext): Promise<void> {
  const { account, config, runtime, abortSignal, statusSink } = ctx;

  runtime.log?.info("WeChat polling mode - checking for messages");

  // Polling would periodically call WeChat's API to get messages
  // For now, just keep the monitor alive
  await new Promise<void>((resolve) => {
    const checkAbort = setInterval(() => {
      if (abortSignal.aborted) {
        clearInterval(checkAbort);
        resolve();
      }
    }, 1000);
  });
}

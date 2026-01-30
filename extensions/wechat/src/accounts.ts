import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { WeChatConfig } from "./config-schema.js";

export interface ResolvedWeChatAccount {
  accountId: string;
  config: WeChatConfig;
  enabled: boolean;
  name?: string;
}

export function resolveWeChatAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): ResolvedWeChatAccount {
  const { cfg, accountId } = params;
  const channelConfig = cfg.channels?.wechat;

  if (!channelConfig) {
    return {
      accountId: "default",
      config: {
        enabled: false,
        msgDataFormat: "plaintext",
        webhookPath: "/wechat-webhook",
        allowFrom: [],
        groups: { requireMention: true },
        dmPolicy: "pairing",
      },
      enabled: false,
    };
  }

  const accountConfig = accountId
    ? channelConfig.accounts?.[accountId]
    : channelConfig;

  return {
    accountId: accountId ?? "default",
    config: (accountConfig ?? channelConfig) as WeChatConfig,
    enabled: channelConfig.enabled ?? false,
    name: accountConfig?.name,
  };
}

export function listWeChatAccountIds(cfg: OpenClawConfig): string[] {
  const channelConfig = cfg.channels?.wechat;
  if (!channelConfig) return [];

  const ids = new Set<string>();
  ids.add("default");

  if (channelConfig.accounts) {
    for (const id of Object.keys(channelConfig.accounts)) {
      if (id !== "default") {
        ids.add(id);
      }
    }
  }

  return Array.from(ids);
}

export function resolveDefaultWeChatAccountId(cfg: OpenClawConfig): string {
  return "default";
}

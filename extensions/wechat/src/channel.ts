import type {
  ChannelAccountSnapshot,
  ChannelDock,
  ChannelPlugin,
  OpenClawConfig,
} from "openclaw/plugin-sdk";
import {
  applyAccountNameToChannelSection,
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  deleteAccountFromConfigSection,
  formatPairingApproveHint,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  PAIRING_APPROVED_MESSAGE,
  setAccountEnabledInConfigSection,
} from "openclaw/plugin-sdk";

import { listWeChatAccountIds, resolveDefaultWeChatAccountId, resolveWeChatAccount, type ResolvedWeChatAccount } from "./accounts.js";
import { wechatMessageActions } from "./actions.js";
import { WeChatConfigSchema, type WeChatConfig } from "./config-schema.js";
import { wechatOnboardingAdapter } from "./onboarding.js";
import { probeWeChat } from "./probe.js";
import { sendMessageWeChat } from "./send.js";
import { collectWeChatStatusIssues } from "./status-issues.js";

const meta = {
  id: "wechat",
  label: "WeChat",
  selectionLabel: "WeChat (Official Account)",
  docsPath: "/channels/wechat",
  docsLabel: "wechat",
  blurb: "WeChat Official Account Platform messaging (微信公众平台)",
  aliases: ["wx", "weixin"],
  order: 90,
  quickstartAllowFrom: true,
};

function normalizeWeChatMessagingTarget(raw: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^(wechat|wx|weixin):/i, "");
}

export const wechatDock: ChannelDock = {
  id: "wechat",
  capabilities: {
    chatTypes: ["direct"],
    media: true,
    blockStreaming: true,
  },
  outbound: { textChunkLimit: 2000 },
  config: {
    resolveAllowFrom: ({ cfg, accountId }) =>
      (resolveWeChatAccount({ cfg: cfg as OpenClawConfig, accountId }).config.allowFrom ?? []).map(
        (entry) => String(entry),
      ),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(wechat|wx|weixin):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
};

export const wechatPlugin: ChannelPlugin<ResolvedWeChatAccount> = {
  id: "wechat",
  meta,
  onboarding: wechatOnboardingAdapter,
  capabilities: {
    chatTypes: ["direct"],
    media: true,
    reactions: false,
    threads: false,
    polls: false,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.wechat"] },
  configSchema: buildChannelConfigSchema(WeChatConfigSchema),
  config: {
    listAccountIds: (cfg) => listWeChatAccountIds(cfg as OpenClawConfig),
    resolveAccount: (cfg, accountId) => resolveWeChatAccount({ cfg: cfg as OpenClawConfig, accountId }),
    defaultAccountId: (cfg) => resolveDefaultWeChatAccountId(cfg as OpenClawConfig),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      setAccountEnabledInConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "wechat",
        accountId,
        enabled,
        allowTopLevel: true,
      }),
    deleteAccount: ({ cfg, accountId }) =>
      deleteAccountFromConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "wechat",
        accountId,
        clearBaseFields: ["appId", "appSecret", "token", "encodingAESKey", "name"],
      }),
    isConfigured: (account) => Boolean(account.config.appId?.trim() && account.config.appSecret?.trim()),
    describeAccount: (account): ChannelAccountSnapshot => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.config.appId?.trim() && account.config.appSecret?.trim()),
      tokenSource: account.config.appSecret ? "appSecret" : "none",
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      (resolveWeChatAccount({ cfg: cfg as OpenClawConfig, accountId }).config.allowFrom ?? []).map(
        (entry) => String(entry),
      ),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(wechat|wx|weixin):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      const resolvedAccountId = accountId ?? account.accountId ?? DEFAULT_ACCOUNT_ID;
      const useAccountPath = Boolean(
        (cfg as OpenClawConfig).channels?.wechat?.accounts?.[resolvedAccountId],
      );
      const basePath = useAccountPath
        ? `channels.wechat.accounts.${resolvedAccountId}.`
        : "channels.wechat.";
      return {
        policy: account.config.dmPolicy ?? "pairing",
        allowFrom: account.config.allowFrom ?? [],
        policyPath: `${basePath}dmPolicy`,
        allowFromPath: basePath,
        approveHint: formatPairingApproveHint("wechat"),
        normalizeEntry: (raw) => raw.replace(/^(wechat|wx|weixin):/i, ""),
      };
    },
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
  actions: wechatMessageActions,
  messaging: {
    normalizeTarget: normalizeWeChatMessagingTarget,
    targetResolver: {
      looksLikeId: (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return false;
        // WeChat OpenIDs are typically 28 characters
        return /^[a-zA-Z0-9_-]{28}$/.test(trimmed);
      },
      hint: "<openId>",
    },
  },
  directory: {
    self: async () => null,
    listPeers: async ({ cfg, accountId, query, limit }) => {
      const account = resolveWeChatAccount({ cfg: cfg as OpenClawConfig, accountId });
      const q = query?.trim().toLowerCase() || "";
      const peers = Array.from(
        new Set(
          (account.config.allowFrom ?? [])
            .map((entry) => String(entry).trim())
            .filter((entry) => Boolean(entry) && entry !== "*")
            .map((entry) => entry.replace(/^(wechat|wx|weixin):/i, "")),
        ),
      )
        .filter((id) => (q ? id.toLowerCase().includes(q) : true))
        .slice(0, limit && limit > 0 ? limit : undefined)
        .map((id) => ({ kind: "user", id }) as const);
      return peers;
    },
    listGroups: async () => [],
  },
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg: cfg as OpenClawConfig,
        channelKey: "wechat",
        accountId,
        name,
      }),
    validateInput: ({ accountId, input }) => {
      if (input.useEnv && accountId !== DEFAULT_ACCOUNT_ID) {
        return "WECHAT_APP_ID and WECHAT_APP_SECRET can only be used for the default account.";
      }
      if (!input.useEnv && !input.appId && !input.appSecret) {
        return "WeChat requires appId and appSecret (or --use-env for default account).";
      }
      return null;
    },
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg: cfg as OpenClawConfig,
        channelKey: "wechat",
        accountId,
        name: input.name,
      });
      const next =
        accountId !== DEFAULT_ACCOUNT_ID
          ? migrateBaseNameToDefaultAccount({
              cfg: namedConfig,
              channelKey: "wechat",
            })
          : namedConfig;

      const channelConfig: Record<string, unknown> = {
        enabled: true,
        ...(input.useEnv
          ? {}
          : input.appId
            ? { appId: input.appId }
            : {}),
        ...(input.useEnv
          ? {}
          : input.appSecret
            ? { appSecret: input.appSecret }
            : {}),
        ...(input.token ? { token: input.token } : {}),
        ...(input.encodingAESKey ? { encodingAESKey: input.encodingAESKey } : {}),
      };

      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...next,
          channels: {
            ...next.channels,
            wechat: {
              ...next.channels?.wechat,
              ...channelConfig,
            },
          },
        } as OpenClawConfig;
      }

      return {
        ...next,
        channels: {
          ...next.channels,
          wechat: {
            ...next.channels?.wechat,
            ...channelConfig,
            accounts: {
              ...(next.channels?.wechat?.accounts ?? {}),
              [accountId]: {
                ...(next.channels?.wechat?.accounts?.[accountId] ?? {}),
                enabled: true,
                ...channelConfig,
              },
            },
          },
        },
      } as OpenClawConfig;
    },
  },
  pairing: {
    idLabel: "wechatOpenId",
    normalizeAllowEntry: (entry) => entry.replace(/^(wechat|wx|weixin):/i, ""),
    notifyApproval: async ({ cfg, id }) => {
      const account = resolveWeChatAccount({ cfg: cfg as OpenClawConfig });
      if (!account.config.appId || !account.config.appSecret) {
        throw new Error("WeChat appId or appSecret not configured");
      }
      await sendMessageWeChat(id, PAIRING_APPROVED_MESSAGE, {
        cfg: cfg as OpenClawConfig,
      });
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: (text, limit) => {
      if (!text) return [];
      if (limit <= 0 || text.length <= limit) return [text];
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > limit) {
        const window = remaining.slice(0, limit);
        const lastNewline = window.lastIndexOf("\n");
        const lastSpace = window.lastIndexOf(" ");
        let breakIdx = lastNewline > 0 ? lastNewline : lastSpace;
        if (breakIdx <= 0) breakIdx = limit;
        const rawChunk = remaining.slice(0, breakIdx);
        const chunk = rawChunk.trimEnd();
        if (chunk.length > 0) chunks.push(chunk);
        const brokeOnSeparator = breakIdx < remaining.length && /\s/.test(remaining[breakIdx]);
        const nextStart = Math.min(remaining.length, breakIdx + (brokeOnSeparator ? 1 : 0));
        remaining = remaining.slice(nextStart).trimStart();
      }
      if (remaining.length) chunks.push(remaining);
      return chunks;
    },
    chunkerMode: "text",
    textChunkLimit: 2000,
    sendText: async ({ to, text, accountId, cfg }) => {
      const result = await sendMessageWeChat(to, text, {
        accountId: accountId ?? undefined,
        cfg: cfg as OpenClawConfig,
      });
      return {
        channel: "wechat",
        ok: result.ok,
        messageId: result.messageId ?? "",
        error: result.error ? new Error(result.error) : undefined,
      };
    },
    sendMedia: async ({ to, text, mediaUrl, accountId, cfg }) => {
      const result = await sendMessageWeChat(to, text, {
        accountId: accountId ?? undefined,
        mediaUrl,
        cfg: cfg as OpenClawConfig,
      });
      return {
        channel: "wechat",
        ok: result.ok,
        messageId: result.messageId ?? "",
        error: result.error ? new Error(result.error) : undefined,
      };
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    collectStatusIssues: collectWeChatStatusIssues,
    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      tokenSource: snapshot.tokenSource ?? "none",
      running: snapshot.running ?? false,
      mode: snapshot.mode ?? null,
      lastStartAt: snapshot.lastStartAt ?? null,
      lastStopAt: snapshot.lastStopAt ?? null,
      lastError: snapshot.lastError ?? null,
      probe: snapshot.probe,
      lastProbeAt: snapshot.lastProbeAt ?? null,
    }),
    probeAccount: async ({ account, timeoutMs }) =>
      probeWeChat(account.config, timeoutMs),
    buildAccountSnapshot: ({ account, runtime }) => {
      const configured = Boolean(account.config.appId?.trim() && account.config.appSecret?.trim());
      return {
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured,
        tokenSource: account.config.appSecret ? "appSecret" : "none",
        running: runtime?.running ?? false,
        lastStartAt: runtime?.lastStartAt ?? null,
        lastStopAt: runtime?.lastStopAt ?? null,
        lastError: runtime?.lastError ?? null,
        mode: account.config.webhookUrl ? "webhook" : "polling",
        lastInboundAt: runtime?.lastInboundAt ?? null,
        lastOutboundAt: runtime?.lastOutboundAt ?? null,
        dmPolicy: account.config.dmPolicy ?? "pairing",
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      let wechatBotLabel = "";
      try {
        const probe = await probeWeChat(account.config, 2500);
        const name = probe.ok ? probe.bot?.name?.trim() : null;
        if (name) wechatBotLabel = ` (${name})`;
        ctx.setStatus({
          accountId: account.accountId,
          bot: probe.bot,
        });
      } catch {
        // ignore probe errors
      }
      ctx.log?.info(`[${account.accountId}] starting WeChat provider${wechatBotLabel}`);
      const { monitorWeChatProvider } = await import("./monitor.js");
      return monitorWeChatProvider({
        account,
        config: ctx.cfg as OpenClawConfig,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        useWebhook: Boolean(account.config.webhookUrl),
        webhookUrl: account.config.webhookUrl,
        webhookSecret: account.config.webhookSecret,
        webhookPath: account.config.webhookPath,
        statusSink: (patch) => ctx.setStatus({ accountId: ctx.accountId, ...patch }),
      });
    },
  },
};

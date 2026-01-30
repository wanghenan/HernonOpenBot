import type { WeChatConfig } from "./config-schema.js";

export interface AccountStatusIssue {
  severity: "error" | "warning" | "info";
  message: string;
  path: string;
}

export type AccountStatusIssues = AccountStatusIssue[];

export function collectWeChatStatusIssues(config: WeChatConfig): AccountStatusIssues {
  const issues: AccountStatusIssues = [];

  if (!config.appId) {
    issues.push({
      severity: "error",
      message: "App ID not configured",
      path: "channels.wechat.appId",
    });
  }

  if (!config.appSecret) {
    issues.push({
      severity: "error",
      message: "App Secret not configured",
      path: "channels.wechat.appSecret",
    });
  }

  if (config.appId && config.appSecret) {
    // Configuration looks complete
  }

  if (!config.token && config.msgDataFormat === "secure") {
    issues.push({
      severity: "warning",
      message: "Token recommended for secure message format",
      path: "channels.wechat.token",
    });
  }

  if (!config.encodingAESKey && config.msgDataFormat === "secure") {
    issues.push({
      severity: "error",
      message: "EncodingAESKey required for secure message format",
      path: "channels.wechat.encodingAESKey",
    });
  }

  return issues;
}

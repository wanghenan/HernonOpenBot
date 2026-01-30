import type { OpenClawConfig } from "openclaw/plugin-sdk";
import type { WeChatConfig } from "./config-schema.js";

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

async function getAccessToken(config: WeChatConfig, proxy?: string): Promise<string | null> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;

  try {
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: { Accept: "application/json" },
    };

    if (proxy) {
      // Use proxy for the request
      fetchOptions.agent = new (await import("node:https")).Agent({
        rejectUnauthorized: false,
      });
    }

    const response = await fetch(url, fetchOptions);
    const data = (await response.json()) as Record<string, unknown>;

    if (data.errcode && data.errcode !== 0) {
      return null;
    }

    return data.access_token as string | null;
  } catch {
    return null;
  }
}

/**
 * 发送微信消息
 * Send WeChat message
 */
export async function sendMessageWeChat(
  to: string,
  text: string,
  options: {
    accountId?: string;
    mediaUrl?: string;
    cfg: OpenClawConfig;
  },
): Promise<SendResult> {
  const { accountId, mediaUrl, cfg } = options;
  const account = cfg.channels?.wechat;
  if (!account?.appId || !account?.appSecret) {
    return { ok: false, error: "WeChat App ID or App Secret not configured" };
  }

  try {
    const accessToken = await getAccessToken(account, account.proxy);

    if (!accessToken) {
      return { ok: false, error: "Failed to get access token" };
    }

    const url = mediaUrl
      ? "https://api.weixin.qq.com/cgi-bin/message/custom/send"
      : "https://api.weixin.qq.com/cgi-bin/message/custom/send";

    const message: Record<string, unknown> = {
      touser: to,
      msgtype: mediaUrl ? "image" : "text",
      text: {
        content: text,
      },
    };

    if (mediaUrl) {
      message.image = { media_url: mediaUrl };
    }

    const response = await fetch(`${url}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data.errcode && data.errcode !== 0) {
      const errcode = data.errcode as number;
      const errmsg = data.errmsg as string;
      return { ok: false, error: `WeChat API error ${errcode}: ${errmsg}` };
    }

    // WeChat doesn't return message IDs for custom messages
    return { ok: true, messageId: `wechat_${Date.now()}` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `Failed to send message: ${errorMessage}` };
  }
}

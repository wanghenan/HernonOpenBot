import type { WeChatConfig } from "./config-schema.js";

export interface WeChatBotInfo {
  id: string;
  name: string;
}

export interface ProbeResult {
  ok: boolean;
  error?: string;
  bot?: WeChatBotInfo;
}

/**
 * 探测微信服务器连接
 * Probe WeChat server connection
 */
export async function probeWeChat(config: WeChatConfig, timeoutMs: number): Promise<ProbeResult> {
  if (!config.appId || !config.appSecret) {
    return { ok: false, error: "App ID or App Secret not configured" };
  }

  try {
    // 获取 access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(tokenUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.errcode && data.errcode !== 0) {
      const errcode = data.errcode as number;
      const errmsg = data.errmsg as string;
      return { ok: false, error: `WeChat API error ${errcode}: ${errmsg}` };
    }

    const accessToken = data.access_token as string | undefined;
    if (!accessToken) {
      return { ok: false, error: "No access_token in response" };
    }

    // 获取账号信息
    const infoUrl = `https://api.weixin.qq.com/cgi-bin/account/getaccountbasicinfo?access_token=${accessToken}`;
    const infoResponse = await fetch(infoUrl, {
      headers: { Accept: "application/json" },
    });

    if (!infoResponse.ok) {
      return { ok: false, error: `Failed to get account info: HTTP ${infoResponse.status}` };
    }

    const infoData = (await infoResponse.json()) as Record<string, unknown>;

    if (infoData.errcode && infoData.errcode !== 0) {
      const errcode = infoData.errcode as number;
      const errmsg = infoData.errmsg as string;
      return { ok: false, error: `WeChat API error ${errcode}: ${errmsg}` };
    }

    return {
      ok: true,
      bot: {
        id: config.appId,
        name: (infoData.nick_name as string) || "WeChat Official Account",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `Connection failed: ${errorMessage}` };
  }
}

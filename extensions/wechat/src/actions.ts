import type { ChannelMessageActions } from "openclaw/plugin-sdk";

export const wechatMessageActions: ChannelMessageActions = {
  async sendMessage() {
    // Handled by outbound.sendText/sendMedia
    return { ok: false, error: new Error("Use outbound.sendText instead") };
  },

  async sendReaction() {
    // WeChat doesn't support reactions
    return { ok: false, error: new Error("WeChat doesn't support reactions") };
  },

  async deleteMessage() {
    // WeChat doesn't support message deletion via API
    return { ok: false, error: new Error("WeChat doesn't support message deletion") };
  },

  async editMessage() {
    // WeChat doesn't support message editing
    return { ok: false, error: new Error("WeChat doesn't support message editing") };
  },

  async uploadMedia() {
    return { ok: false, error: new Error("Use outbound.sendMedia instead") };
  },

  async getMedia() {
    return { ok: false, error: new Error("Media retrieval not yet implemented") };
  },
};

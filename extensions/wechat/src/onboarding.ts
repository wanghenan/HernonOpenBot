import type { ChannelOnboardingAdapter } from "openclaw/plugin-sdk";

export const wechatOnboardingAdapter: ChannelOnboardingAdapter = {
  id: "wechat",
  name: "WeChat",
  description: "Connect your WeChat Official Account to receive and send messages",
  steps: [
    {
      id: "appId",
      type: "input",
      label: "App ID (应用ID)",
      description: "Your WeChat Official Account App ID",
      password: false,
      placeholder: "wx1234567890abcdef",
      validate: async (value) => {
        if (!value || value.length < 10) {
          return "Please enter a valid App ID";
        }
        return null;
      },
    },
    {
      id: "appSecret",
      type: "input",
      label: "App Secret (应用密钥)",
      description: "Your WeChat Official Account App Secret",
      password: true,
      placeholder: "Your App Secret",
      validate: async (value) => {
        if (!value || value.length < 10) {
          return "Please enter a valid App Secret";
        }
        return null;
      },
    },
    {
      id: "token",
      type: "input",
      label: "Token (令牌)",
      description: "Token for server verification (optional but recommended)",
      password: false,
      placeholder: "your-token",
      required: false,
      validate: async (value) => {
        if (value && value.length < 3) {
          return "Token must be at least 3 characters";
        }
        return null;
      },
    },
    {
      id: "encodingAESKey",
      type: "input",
      label: "Encoding AES Key (消息加解密密钥)",
      description: "43-character key for message encryption (optional)",
      password: false,
      placeholder: "43-character key for encryption",
      required: false,
      validate: async (value) => {
        if (value && value.length !== 43) {
          return "EncodingAESKey must be exactly 43 characters";
        }
        return null;
      },
    },
  ],
  docsLinks: [
    {
      label: "WeChat Official Account Documentation",
      url: "https://developers.weixin.qq.com/doc/offiaccount/en/",
    },
    {
      label: "OpenClaw WeChat Configuration",
      url: "https://docs.openclaw.ai/channels/wechat",
    },
  ],
};

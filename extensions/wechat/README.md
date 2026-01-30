# @openclaw/wechat

WeChat Official Account channel plugin for OpenClaw (微信公众平台).

## 安装 (Install)

### 本地安装 (Local Checkout)

```bash
openclaw plugins install ./extensions/wechat
```

### npm 安装 (npm Install)

```bash
openclaw plugins install @openclaw/wechat
```

Onboarding: 选择 WeChat 并确认安装提示以自动获取插件。

## 配置 (Config)

```json5
{
  channels: {
    wechat: {
      enabled: true,
      appId: "wx1234567890abcdef",
      appSecret: "your-app-secret-here",
      token: "your-token",
      encodingAESKey: "your-encoding-aes-key",
      dmPolicy: "pairing",
      allowFrom: ["user_openid_1", "user_openid_2"],
      proxy: "http://proxy.local:8080"
    }
  }
}
```

## 配置说明 (Configuration)

| 配置项 | 必填 | 说明 |
|--------|------|------|
| `appId` | 是 | 微信公众平台应用ID |
| `appSecret` | 是 | 微信公众平台应用密钥 |
| `token` | 否 | 服务器验证令牌 |
| `encodingAESKey` | 否 | 消息加解密密钥 (43字符) |
| `msgDataFormat` | 否 | 消息格式: `plaintext`, `compatible`, `secure` |
| `dmPolicy` | 否 | 直接消息策略: `pairing`, `open`, `closed` |
| `allowFrom` | 否 | 允许接收消息的用户OpenID列表 |
| `proxy` | 否 | 代理服务器地址 |

## Webhook 模式 (Webhook Mode)

```json5
{
  channels: {
    wechat: {
      webhookUrl: "https://your-domain.com/wechat-webhook",
      webhookSecret: "your-webhook-secret",
      webhookPath: "/wechat-webhook"
    }
  }
}
```

如果 `webhookPath` 省略，插件将使用默认路径 `/wechat-webhook`。

配置更改后重启 gateway。

## 权限要求 (Permissions)

- 微信公众平台账号 (订阅号或服务号)
- 已启用服务器配置
- 已获取 AppID 和 AppSecret

## 消息类型 (Message Types)

- ✅ 文本消息 (Text messages)
- ✅ 图片消息 (Image messages)
- ❌ 语音消息 (Voice messages) - 待支持
- ❌ 视频消息 (Video messages) - 待支持

## 相关文档 (Related Docs)

- [OpenClaw 文档](https://docs.openclaw.ai)
- [微信公众平台文档](https://developers.weixin.qq.com/doc/offiaccount/en/)
- [OpenClaw 通道配置](https://docs.openclaw.ai/channels)

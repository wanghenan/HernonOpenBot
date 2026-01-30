import { z } from "zod";

/**
 * 微信公众平台配置 Schema
 * WeChat Official Account Platform Configuration Schema
 */
export const WeChatConfigSchema = z.object({
  /** 是否启用微信通道 */
  enabled: z.boolean().default(false),

  /** 应用ID (AppID) */
  appId: z.string().optional(),

  /** 应用密钥 (AppSecret) */
  appSecret: z.string().optional(),

  /** 令牌 (Token) - 用于服务器验证 */
  token: z.string().optional(),

  /** 消息加解密密钥 (EncodingAESKey) */
  encodingAESKey: z.string().optional(),

  /** 消息格式: plaintext - 明文, compatible - 兼容,安全 - secure */
  msgDataFormat: z.enum(["plaintext", "compatible", "secure"]).default("plaintext"),

  /** Webhook 路径 */
  webhookPath: z.string().default("/wechat-webhook"),

  /** Webhook URL (外部可访问的完整URL) */
  webhookUrl: z.string().url().optional(),

  /** Webhook 密钥 (用于验证请求来源) */
  webhookSecret: z.string().optional(),

  /** 代理配置 */
  proxy: z.string().url().optional(),

  /** 接收消息的用户OpenID白名单 */
  allowFrom: z.array(z.string()).default([]),

  /** 群组策略 */
  groups: z
    .object({
      /** 是否需要 @提及才响应 */
      requireMention: z.boolean().default(true),
    })
    .optional()
    .default({ requireMention: true }),

  /** 直接消息策略 */
  dmPolicy: z.enum(["pairing", "open", "closed"]).default("pairing"),
});

export type WeChatConfig = z.infer<typeof WeChatConfigSchema>;

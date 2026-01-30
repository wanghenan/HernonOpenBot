# Channels 模块

消息通道抽象层，统一处理多平台消息。

## 架构设计

```
channels/
├── index.ts              # 通道抽象接口
├── routing.ts            # 消息路由
├── registry.ts           # 通道注册表
├── base.ts               # 基础通道类
├── config.ts             # 通道配置
└── plugins/              # 插件通道
```

## 内置通道

| 通道 | 实现文件 | 状态 |
|------|----------|------|
| Telegram | `../telegram/` | ✅ 稳定 |
| Discord | `../discord/` | ✅ 稳定 |
| WhatsApp | `../whatsapp/` | ✅ 稳定 |
| Slack | `../slack/` | ✅ 稳定 |
| Signal | `../signal/` | ✅ 稳定 |
| iMessage | `../imessage/` | ✅ 稳定 |
| Line | `../line/` | ⏸️ 可选 |
| WebChat | `../web/` | ✅ 稳定 |

## 通道接口

```typescript
interface Channel {
  id: string;
  type: ChannelType;
  status: ChannelStatus;

  // 生命周期
  start(): Promise<void>;
  stop(): Promise<void>;

  // 消息处理
  send(message: OutboundMessage): Promise<void>;
  receive(handler: MessageHandler): void;

  // 状态
  health(): Promise<ChannelHealth>;
}
```

## 使用方式

```typescript
import { channelRegistry } from "./registry.js";

// 获取通道实例
const telegram = channelRegistry.get("telegram");

// 启动通道
await telegram.start();

// 发送消息
await telegram.send({
  to: "user123",
  content: "Hello!",
});
```

## 添加新通道

1. 在 `src/` 下创建目录（如 `src/mychannel/`）
2. 实现 `Channel` 接口
3. 在 `channels/registry.ts` 中注册
4. 添加配置 schema 到 `src/config/zod-schema.channels.ts`

## 消息路由

```typescript
// 配置路由规则
const routing = {
  defaultChannel: "telegram",
  rules: [
    { pattern: /^@bot/, channel: "discord" },
    { from: "+1234567890", channel: "whatsapp" },
  ],
};
```

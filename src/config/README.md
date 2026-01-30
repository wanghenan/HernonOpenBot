# Config 模块

配置 schema 定义，使用 Zod 进行类型验证。

## 文件结构

```
config/
├── zod-schema.ts              # 主配置入口
├── zod-schema.core.ts         # 核心配置（gateway, logging 等）
├── zod-schema.agents.ts       # Agent 配置
├── zod-schema.agent-runtime.ts # Agent 运行时配置
├── zod-schema.agent-defaults.ts # Agent 默认值
├── zod-schema.channels.ts     # 通道配置
├── zod-schema.providers.ts    # 模型提供商配置
├── zod-schema.providers-core.ts # 核心提供商配置
├── zod-schema.providers-whatsapp.ts # WhatsApp 特定配置
├── zod-schema.session.ts      # 会话配置
├── zod-schema.hooks.ts        # Hooks 配置
├── zod-schema.approvals.ts    # 审批配置
└── zod-schema.providers.ts    # 完整配置导出
```

## 配置验证

```typescript
import { loadConfig, configSchema } from "./zod-schema.js";

// 加载并验证配置
const config = loadConfig();

// 安全解析
const result = configSchema.safeParse(rawConfig);
if (!result.success) {
  console.log(result.error.issues);
}
```

## 添加新配置项

1. 在对应文件中添加 Zod schema 定义
2. 导出到主入口
3. 在 `src/config/zod-schema.ts` 中组合

```typescript
// 示例：添加新配置
export const myFeatureSchema = z.object({
  enabled: z.boolean().default(false),
  timeout: z.number().positive().default(30000),
});
```

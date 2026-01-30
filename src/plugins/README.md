# Plugins 模块

插件系统架构，支持扩展功能。

## 架构设计

```
plugins/
├── schema-validator.ts        # Schema 验证器（Zod）
├── manager.ts                 # 插件管理器
├── registry.ts                # 插件注册表
├── loader.ts                  # 插件加载器
├── lifecycle.ts               # 插件生命周期
└── config-schema.ts           # 插件配置 schema
```

## 插件开发

### 1. 定义插件配置

```typescript
import { z } from "zod";

export const myPluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  optionA: z.string(),
});
```

### 2. 实现插件接口

```typescript
import type { Plugin, PluginContext } from "./types.js";

export const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  configSchema: myPluginConfigSchema,

  async load(ctx: PluginContext) {
    // 初始化插件
  },

  async unload() {
    // 清理资源
  },
};
```

### 3. 注册插件

```typescript
import { pluginManager } from "./manager.js";

pluginManager.register(myPlugin);
```

## 插件配置验证

```typescript
import { validateJsonSchemaValue } from "./schema-validator.js";

const result = validateJsonSchemaValue({
  schema: myPluginConfigSchema,
  cacheKey: "my-plugin",
  value: userConfig,
});

if (!result.ok) {
  console.log(result.errors);
}
```

## 最佳实践

- 使用 Zod 定义配置 schema
- 实现 `load` 和 `unload` 生命周期方法
- 提供默认配置值
- 优雅处理配置错误

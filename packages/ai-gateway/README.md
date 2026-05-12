# AI Gateway

AI模型网关 - 为AI小说创作系统提供统一的模型访问接口。

## 功能特性

- ✅ **多模型适配器**: 支持10+主流AI模型提供商
- ✅ **Token统计与成本控制**: 实时追踪Token使用和成本
- ✅ **流式输出(SSE)**: 支持流式响应，提升用户体验
- ✅ **失败重试机制**: 自动重试和智能降级
- ✅ **日志脱敏**: 自动脱敏敏感信息
- ✅ **模型路由策略**: 多种路由策略智能选择模型

## 支持的模型提供商

### 国际模型
1. **OpenAI** - GPT-4, GPT-4-Turbo, GPT-4o, GPT-3.5-Turbo
2. **Anthropic** - Claude 3 Opus/Sonnet/Haiku
3. **Google** - Gemini Pro, Gemini 1.5 Pro/Flash

### 国产模型
4. **通义千问** - Qwen-Max/Plus/Turbo
5. **智谱AI** - GLM-4, GLM-4-Flash
6. **DeepSeek** - DeepSeek-Chat, DeepSeek-Coder
7. **文心一言** - ERNIE-Bot-4, ERNIE-Bot

### 本地模型
8. **Ollama** - 支持Llama2, Mistral等
9. **LM Studio** - 本地模型推理
10. **vLLM** - 高性能推理引擎

### 自定义API
11. **OpenAI兼容接口** - 支持任何OpenAI兼容的API

## 推荐模型策略

| Agent角色 | 推荐模型 | 特点 |
|----------|---------|------|
| Planner | Claude-3-Opus, GPT-4 | 长上下文、逻辑强 |
| Writer | Claude-3-Sonnet, GPT-4o, Qwen-Max | 文学表达强、中文好 |
| DeepReader | GPT-3.5-Turbo, Claude-3-Haiku | 读者偏好判断 |
| DeepEditor | Claude-3-Sonnet, GPT-4-Turbo | 商业网文理解 |
| Auditor | Claude-3-Opus, GPT-4-Turbo | 逻辑严谨、低幻觉 |
| Reviser | Claude-3-Sonnet, GPT-4o, Qwen-Max | 文本改写强 |
| Settler | GPT-3.5-Turbo, GLM-4 | 信息抽取稳定 |

## 安装

```bash
npm install @ai-novel/ai-gateway
```

## 快速开始

```typescript
import { AIGateway } from '@ai-novel/ai-gateway';

// 创建Gateway实例
const gateway = new AIGateway({
  providers: new Map([
    ['openai', {
      provider: 'openai',
      model: 'gpt-4-turbo',
      apiKey: process.env.OPENAI_API_KEY
    }],
    ['anthropic', {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY
    }]
  ])
});

// 发送请求
const response = await gateway.complete({
  messages: [
    { role: 'system', content: '你是一个专业的小说创作助手' },
    { role: 'user', content: '帮我构思一个科幻小说的开头' }
  ]
});

console.log(response.choices[0].message.content);
```

## 使用角色路由

```typescript
// 按角色自动选择最优模型
const response = await gateway.completeByRole('writer', {
  messages: [
    { role: 'system', content: '你是一个网文写作专家' },
    { role: 'user', content: '续写这段情节...' }
  ]
});
```

## 流式输出

```typescript
// 流式生成
const usage = await gateway.completeStream(
  {
    messages: [{ role: 'user', content: '写一段武侠打斗场景' }]
  },
  (chunk) => {
    process.stdout.write(chunk.delta.content || '');
  }
);

console.log('\n\nToken usage:', usage);
```

## Token统计和成本控制

```typescript
// 获取今日统计
const stats = gateway.getTokenStatistics().getTodayStats();
console.log('今日Token使用:', stats.totalTokens);
console.log('请求数:', stats.requestCount);

// 计算成本
const cost = gateway.calculateCost(response.usage, response.model);
console.log('本次成本:', cost.totalCost, 'USD');
```

## 配置模型路由

```typescript
// 为角色配置模型
gateway.registerModelForRole('writer', {
  role: 'writer',
  provider: 'qwen',
  model: 'qwen-max',
  apiKey: process.env.QWEN_API_KEY,
  temperature: 0.8,
  maxTokens: 8192,
  fallbackModels: [
    { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
    { provider: 'openai', model: 'gpt-4o' }
  ]
});
```

## 路由策略

```typescript
// 优先级策略（默认）
const gateway = new AIGateway({
  providers: providerConfigs,
  routingStrategy: 'priority'  // 使用主模型，失败时切换到fallback
});

// 轮询策略
routingStrategy: 'round-robin'  // 在可用模型间轮询

// 成本优先策略
routingStrategy: 'least-cost'  // 选择成本最低的模型

// 延迟优先策略
routingStrategy: 'latency-based'  // 选择响应最快的模型
```

## 本地模型支持

```typescript
// Ollama
gateway.registerProvider('ollama', {
  provider: 'ollama',
  model: 'llama2',
  baseUrl: 'http://localhost:11434'
});

// LM Studio
gateway.registerProvider('lmstudio', {
  provider: 'lmstudio',
  model: 'local-model',
  baseUrl: 'http://localhost:1234/v1'
});
```

## 日志配置

```typescript
const gateway = new AIGateway({
  providers: providerConfigs,
  logConfig: {
    level: 'info',
    enableSensitiveDataLogging: false,  // 自动脱敏API Key等
    logRequests: true,
    logResponses: false,
    logTokenUsage: true
  }
});
```

## API文档

### AIGateway

#### `complete(request: CompletionRequest): Promise<CompletionResponse>`
发送完成请求（非流式）

#### `completeStream(request, onChunk, onError?, onComplete?): Promise<TokenUsage>`
发送流式完成请求

#### `completeByRole(role: ModelRole, request): Promise<CompletionResponse>`
按角色完成请求（自动路由到最优模型）

#### `registerProvider(providerType: AIProvider, config: ModelConfig): Promise<void>`
注册新的模型提供商

#### `registerModelForRole(role: ModelRole, config): void`
为特定角色注册模型配置

#### `getTokenStatistics(): TokenStatistics`
获取Token统计实例

#### `calculateCost(usage: TokenUsage, model: string): CostBreakdown`
计算指定使用量的成本

#### `healthCheck(): Promise<Record<AIProvider, boolean>>`
检查所有提供商的健康状态

## 项目结构

```
ai-gateway/
├── src/
│   ├── types/              # 类型定义
│   │   └── index.ts
│   ├── interfaces/         # 接口定义
│   │   └── provider.interface.ts
│   ├── providers/          # 模型适配器
│   │   ├── base.provider.ts
│   │   ├── openai.provider.ts
│   │   ├── anthropic.provider.ts
│   │   ├── google.provider.ts
│   │   ├── chinese.provider.ts
│   │   ├── local.provider.ts
│   │   ├── custom.provider.ts
│   │   └── index.ts
│   ├── services/           # 核心服务
│   │   ├── token-statistics.ts
│   │   ├── model-router.ts
│   │   └── logger.ts
│   ├── gateway.ts          # Gateway主类
│   └── index.ts            # 导出入口
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
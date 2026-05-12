/**
 * AI Gateway 使用示例
 */

import { AIGateway, ModelRole, CompletionRequest } from './src';

// ========== 示例1: 基础使用 ==========

async function basicExample() {
  // 创建Gateway实例
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!
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

  console.log('Response:', response.choices[0].message.content);
  console.log('Token usage:', response.usage);
  console.log('Latency:', response.latency, 'ms');

  await gateway.dispose();
}

// ========== 示例2: 多模型配置 ==========

async function multiProviderExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!
      }],
      ['anthropic', {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY!
      }],
      ['qwen', {
        provider: 'qwen',
        model: 'qwen-max',
        apiKey: process.env.QWEN_API_KEY!
      }]
    ]),
    routingStrategy: 'priority'
  });

  // 按角色路由
  const response = await gateway.completeByRole('writer', {
    messages: [
      { role: 'user', content: '写一段玄幻小说的修炼场景' }
    ]
  });

  console.log('Model used:', response.model);
  console.log('Provider:', response.provider);

  await gateway.dispose();
}

// ========== 示例3: 流式输出 ==========

async function streamExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['anthropic', {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY!
      }]
    ])
  });

  console.log('Streaming response:\n');

  const usage = await gateway.completeStream(
    {
      messages: [
        { role: 'system', content: '你是网文创作专家' },
        { role: 'user', content: '创作一段都市异能小说的开头，主角在地铁站觉醒能力' }
      ],
      maxTokens: 2000
    },
    (chunk) => {
      // 实时输出
      process.stdout.write(chunk.delta.content || '');
    },
    (error) => {
      console.error('\nError:', error.message);
    },
    (usage) => {
      console.log('\n\n=== Stream Complete ===');
      console.log('Token usage:', usage);
    }
  );

  await gateway.dispose();
}

// ========== 示例4: 角色专用模型 ==========

async function roleBasedExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!
      }]
    ])
  });

  // 为不同角色配置不同的模型
  gateway.registerModelForRole('planner', {
    role: 'planner',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0.7,
    maxTokens: 4096
  });

  gateway.registerModelForRole('writer', {
    role: 'writer',
    provider: 'qwen',
    model: 'qwen-max',
    apiKey: process.env.QWEN_API_KEY!,
    temperature: 0.8,
    maxTokens: 8192,
    fallbackModels: [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', temperature: 0.8 }
    ]
  });

  gateway.registerModelForRole('auditor', {
    role: 'auditor',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0.3,
    maxTokens: 4096
  });

  // Planner: 规划大纲
  const plan = await gateway.completeByRole('planner', {
    messages: [
      { role: 'user', content: '为一部都市异能小说规划前三章的大纲' }
    ]
  });

  // Writer: 生成正文
  const content = await gateway.completeByRole('writer', {
    messages: [
      { role: 'user', content: '根据大纲生成第一章正文...' }
    ]
  });

  // Auditor: 审核内容
  const audit = await gateway.completeByRole('auditor', {
    messages: [
      { role: 'user', content: '审核这段内容的逻辑连贯性和情节合理性...' }
    ]
  });

  await gateway.dispose();
}

// ========== 示例5: Token统计和成本控制 ==========

async function statisticsExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!
      }]
    ])
  });

  // 执行多次请求
  for (let i = 0; i < 5; i++) {
    await gateway.complete({
      messages: [
        { role: 'user', content: `写一段第${i + 1}章的内容` }
      ],
      userId: 'user-001',
      conversationId: 'novel-session-001'
    });
  }

  // 获取统计信息
  const stats = gateway.getTokenStatistics();
  
  console.log('=== 今日统计 ===');
  const todayStats = stats.getTodayStats();
  console.log('总Token:', todayStats.totalTokens);
  console.log('请求数:', todayStats.requestCount);
  console.log('按模型:', todayStats.byModel);

  console.log('\n=== 用户统计 ===');
  const userStats = stats.getStatsByUser('user-001', 7);
  console.log('用户user-001近7天统计:', userStats);

  console.log('\n=== 成本计算 ===');
  const cost = gateway.calculateCost(
    { promptTokens: 1000, completionTokens: 2000, totalTokens: 3000 },
    'gpt-4-turbo'
  );
  console.log('成本:', cost);

  await gateway.dispose();
}

// ========== 示例6: 本地模型 ==========

async function localModelExample() {
  const gateway = new AIGateway({
    providers: new Map()
  });

  // 注册Ollama本地模型
  await gateway.registerProvider('ollama', {
    provider: 'ollama',
    model: 'llama2',
    baseUrl: 'http://localhost:11434'
  });

  // 使用本地模型
  const response = await gateway.complete({
    model: 'llama2',
    messages: [
      { role: 'user', content: '写一段小说开头' }
    ]
  });

  console.log('Local model response:', response.choices[0].message.content);

  await gateway.dispose();
}

// ========== 示例7: 错误处理和重试 ==========

async function errorHandlingExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!,
        maxRetries: 3,
        timeout: 60000
      }]
    ])
  });

  try {
    const response = await gateway.complete({
      messages: [
        { role: 'user', content: '生成内容...' }
      ]
    });
    console.log('Success:', response);
  } catch (error: any) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Provider:', error.provider);
    
    // 根据错误类型处理
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.log('速率限制，稍后重试...');
        break;
      case 'CONTEXT_LENGTH_EXCEEDED':
        console.log('上下文过长，需要分段处理...');
        break;
      case 'AUTHENTICATION_ERROR':
        console.log('认证失败，检查API Key...');
        break;
    }
  }

  await gateway.dispose();
}

// ========== 示例8: 健康检查 ==========

async function healthCheckExample() {
  const gateway = new AIGateway({
    providers: new Map([
      ['openai', {
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY!
      }],
      ['anthropic', {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY!
      }]
    ])
  });

  console.log('=== 健康检查 ===');
  const health = await gateway.healthCheck();
  
  for (const [provider, status] of Object.entries(health)) {
    console.log(`${provider}: ${status ? '✓ 正常' : '✗ 异常'}`);
  }

  await gateway.dispose();
}

// ========== 运行示例 ==========

async function main() {
  console.log('AI Gateway 使用示例\n');

  // 选择要运行的示例
  const example = process.argv[2] || 'basic';

  switch (example) {
    case 'basic':
      await basicExample();
      break;
    case 'multi':
      await multiProviderExample();
      break;
    case 'stream':
      await streamExample();
      break;
    case 'role':
      await roleBasedExample();
      break;
    case 'stats':
      await statisticsExample();
      break;
    case 'local':
      await localModelExample();
      break;
    case 'error':
      await errorHandlingExample();
      break;
    case 'health':
      await healthCheckExample();
      break;
    default:
      console.log('可用示例: basic, multi, stream, role, stats, local, error, health');
  }
}

// 运行
main().catch(console.error);
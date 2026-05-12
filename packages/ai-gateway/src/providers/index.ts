/**
 * 模型提供商导出
 */

export { AIModelProvider } from '../interfaces/provider.interface';
export { BaseProvider } from './base.provider';
export { OpenAIProvider } from './openai.provider';
export { AnthropicProvider } from './anthropic.provider';
export { GoogleProvider } from './google.provider';
export { 
  ChineseProvider, 
  QWEN_CONFIG, 
  ZHIPU_CONFIG, 
  DEEPSEEK_CONFIG, 
  WENXIN_CONFIG 
} from './chinese.provider';
export { 
  LocalProvider, 
  OLLAMA_CONFIG, 
  LMSTUDIO_CONFIG, 
  VLLM_CONFIG 
} from './local.provider';
export { CustomProvider } from './custom.provider';

// 提供商工厂函数
import { AIProvider, ModelConfig } from '../types';
import { AIModelProvider } from '../interfaces/provider.interface';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleProvider } from './google.provider';
import { ChineseProvider, QWEN_CONFIG, ZHIPU_CONFIG, DEEPSEEK_CONFIG, WENXIN_CONFIG } from './chinese.provider';
import { LocalProvider, OLLAMA_CONFIG, LMSTUDIO_CONFIG, VLLM_CONFIG } from './local.provider';
import { CustomProvider } from './custom.provider';

export function createProvider(
  providerType: AIProvider,
  config: ModelConfig
): AIModelProvider {
  switch (providerType) {
    case 'openai':
      return new OpenAIProvider();
    
    case 'anthropic':
      return new AnthropicProvider();
    
    case 'google':
      return new GoogleProvider();
    
    case 'qwen':
      return new ChineseProvider(QWEN_CONFIG);
    
    case 'zhipu':
      return new ChineseProvider(ZHIPU_CONFIG);
    
    case 'deepseek':
      return new ChineseProvider(DEEPSEEK_CONFIG);
    
    case 'wenxin':
      return new ChineseProvider(WENXIN_CONFIG);
    
    case 'ollama':
      return new LocalProvider(OLLAMA_CONFIG);
    
    case 'lmstudio':
      return new LocalProvider(LMSTUDIO_CONFIG);
    
    case 'vllm':
      return new LocalProvider(VLLM_CONFIG);
    
    case 'custom':
      return new CustomProvider();
    
    default:
      throw new Error(`Unknown provider: ${providerType}`);
  }
}
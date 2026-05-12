/**
 * 知识库工厂和提供者
 * 支持本地/云端模式切换
 */

import {
  KnowledgeSource,
  KnowledgeCategory
} from '../types';
import {
  IKnowledgeBase,
  IKnowledgeBaseFactory,
  IKnowledgeBaseProvider,
  KnowledgeBaseConfig
} from '../interfaces';
import { LocalKnowledgeBaseFull } from '../local/LocalKnowledgeBaseFull';
import { CloudKnowledgeBase } from '../cloud/CloudKnowledgeBase';

/**
 * 知识库工厂
 */
export class KnowledgeBaseFactory implements IKnowledgeBaseFactory {
  create(config: KnowledgeBaseConfig): IKnowledgeBase {
    switch (config.source) {
      case KnowledgeSource.LOCAL:
        return new LocalKnowledgeBaseFull();

      case KnowledgeSource.CLOUD:
        return new CloudKnowledgeBase();

      case KnowledgeSource.HYBRID:
        // 混合模式: 优先本地,云端作为后备
        // 未来可以实现HybridKnowledgeBase
        return new LocalKnowledgeBaseFull();

      default:
        throw new Error(`Unsupported knowledge source: ${config.source}`);
    }
  }

  getDefault(tenantId: string): IKnowledgeBase {
    return this.create({
      tenantId,
      source: KnowledgeSource.LOCAL,
      local: {
        enableFTS: true,
        ftsTokenizer: 'unicode61'
      }
    });
  }
}

/**
 * 知识库提供者(单例模式)
 */
export class KnowledgeBaseProvider implements IKnowledgeBaseProvider {
  private static instance: KnowledgeBaseProvider;
  private factories: Map<KnowledgeSource, IKnowledgeBaseFactory> = new Map();
  private instances: Map<string, IKnowledgeBase> = new Map();

  private constructor() {
    // 注册默认工厂
    this.register(KnowledgeSource.LOCAL, new KnowledgeBaseFactory());
    this.register(KnowledgeSource.CLOUD, new KnowledgeBaseFactory());
  }

  static getInstance(): KnowledgeBaseProvider {
    if (!KnowledgeBaseProvider.instance) {
      KnowledgeBaseProvider.instance = new KnowledgeBaseProvider();
    }
    return KnowledgeBaseProvider.instance;
  }

  register(source: KnowledgeSource, factory: IKnowledgeBaseFactory): void {
    this.factories.set(source, factory);
  }

  get(config: KnowledgeBaseConfig): IKnowledgeBase {
    const cacheKey = `${config.tenantId}:${config.source}`;

    // 检查缓存
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    // 获取工厂
    const factory = this.factories.get(config.source);
    if (!factory) {
      throw new Error(`No factory registered for source: ${config.source}`);
    }

    // 创建实例
    const instance = factory.create(config);
    this.instances.set(cacheKey, instance);

    return instance;
  }

  getAvailableSources(): KnowledgeSource[] {
    return Array.from(this.factories.keys());
  }

  /**
   * 清理缓存的实例
   */
  async clearCache(): Promise<void> {
    for (const instance of this.instances.values()) {
      await instance.close();
    }
    this.instances.clear();
  }
}

/**
 * 获取知识库实例(便捷方法)
 */
export async function getKnowledgeBase(config: KnowledgeBaseConfig): Promise<IKnowledgeBase> {
  const provider = KnowledgeBaseProvider.getInstance();
  const kb = provider.get(config);
  await kb.initialize(config);
  return kb;
}

/**
 * 获取默认本地知识库(便捷方法)
 */
export async function getDefaultKnowledgeBase(tenantId: string): Promise<IKnowledgeBase> {
  return getKnowledgeBase({
    tenantId,
    source: KnowledgeSource.LOCAL,
    local: {
      enableFTS: true
    }
  });
}

/**
 * 知识库导入工具
 * 从文件系统导入知识库内容到数据库
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  KnowledgeEntry,
  KnowledgeCategory,
  EntryStatus
} from '../types';
import { IKnowledgeBase } from '../interfaces';

/**
 * 导入配置
 */
export interface ImportConfig {
  knowledgeDir: string;          // 知识库根目录
  tenantId: string;
  userId: string;
  batchSize?: number;            // 批量导入大小,默认50
  skipExisting?: boolean;        // 是否跳过已存在的条目
  updateExisting?: boolean;      // 是否更新已存在的条目
}

/**
 * 导入结果
 */
export interface ImportResult {
  total: number;                 // 总文件数
  imported: number;              // 成功导入数
  skipped: number;               // 跳过数
  errors: Array<{
    file: string;
    error: string;
  }>;
  categories: Map<KnowledgeCategory, number>;  // 各分类导入数量
}

/**
 * 分类映射
 */
const CATEGORY_MAP: Record<string, KnowledgeCategory> = {
  'tutorials': KnowledgeCategory.TUTORIALS,
  'techniques': KnowledgeCategory.TECHNIQUES,
  'plots': KnowledgeCategory.PLOTS,
  'characters': KnowledgeCategory.CHARACTERS,
  'world': KnowledgeCategory.WORLD,
  'scenes': KnowledgeCategory.SCENES,
  'reference': KnowledgeCategory.REFERENCE,
  'operations': KnowledgeCategory.OPERATIONS,
  'case_studies': KnowledgeCategory.CASE_STUDIES,
  'concepts': KnowledgeCategory.CONCEPTS,
  'entities': KnowledgeCategory.ENTITIES
};

/**
 * 知识库导入器
 */
export class KnowledgeImporter {
  private kb: IKnowledgeBase;

  constructor(knowledgeBase: IKnowledgeBase) {
    this.kb = knowledgeBase;
  }

  /**
   * 从目录导入知识库
   */
  async importFromDirectory(config: ImportConfig): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      categories: new Map()
    };

    // 初始化分类计数
    Object.values(KnowledgeCategory).forEach(cat => {
      result.categories.set(cat, 0);
    });

    // 遍历所有分类目录
    for (const [dirName, category] of Object.entries(CATEGORY_MAP)) {
      const categoryDir = path.join(config.knowledgeDir, dirName);

      if (!fs.existsSync(categoryDir)) {
        console.log(`Directory not found: ${categoryDir}`);
        continue;
      }

      // 获取所有markdown文件
      const files = this.getMarkdownFiles(categoryDir);
      result.total += files.length;

      // 批量导入
      const batchSize = config.batchSize || 50;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        for (const filePath of batch) {
          try {
            const imported = await this.importFile(
              filePath,
              category,
              config
            );

            if (imported) {
              result.imported++;
              result.categories.set(
                category,
                (result.categories.get(category) || 0) + 1
              );
            } else {
              result.skipped++;
            }
          } catch (error) {
            result.errors.push({
              file: filePath,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        console.log(`Imported ${Math.min(i + batchSize, files.length)}/${files.length} files from ${dirName}`);
      }
    }

    return result;
  }

  /**
   * 导入单个文件
   */
  private async importFile(
    filePath: string,
    category: KnowledgeCategory,
    config: ImportConfig
  ): Promise<boolean> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = this.extractTitle(content, path.basename(filePath));
    const summary = this.extractSummary(content);

    // 检查是否已存在
    if (config.skipExisting) {
      const existing = await this.findExistingEntry(title, config.tenantId, category);
      if (existing) {
        if (config.updateExisting) {
          await this.kb.updateEntry(existing.id, config.tenantId, {
            content,
            summary,
            title
          });
          return true;
        }
        return false;
      }
    }

    // 创建新条目
    const entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: config.tenantId,
      userId: config.userId,
      category,
      title,
      content,
      summary,
      source: path.basename(filePath),
      tags: this.extractTags(content),
      version: 1,
      status: EntryStatus.PUBLISHED
    };

    await this.kb.createEntry(entry);
    return true;
  }

  /**
   * 获取目录下所有markdown文件
   */
  private getMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // 递归处理子目录
        files.push(...this.getMarkdownFiles(fullPath));
      } else if (item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 从内容中提取标题
   */
  private extractTitle(content: string, fallback: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1].trim();
    }
    return fallback.replace('.md', '');
  }

  /**
   * 提取摘要(前300字)
   */
  private extractSummary(content: string): string {
    // 移除标题和YAML前置信息
    let cleanContent = content
      .replace(/^---[\s\S]*?---/m, '')
      .replace(/^#\s+.+$/m, '')
      .trim();

    // 取前300字符
    if (cleanContent.length > 300) {
      cleanContent = cleanContent.substring(0, 300) + '...';
    }

    return cleanContent;
  }

  /**
   * 提取标签
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // 从YAML前置信息中提取
    const yamlMatch = content.match(/^---[\s\S]*?^---/m);
    if (yamlMatch) {
      const yaml = yamlMatch[0];
      const tagsMatch = yaml.match(/tags:\s*\[(.+)\]/);
      if (tagsMatch) {
        tags.push(...tagsMatch[1].split(',').map(t => t.trim()));
      }
    }

    // 从标题中提取关键词
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      const title = titleMatch[1];
      // 提取中英文关键词
      const keywords = title.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g);
      if (keywords) {
        tags.push(...keywords.slice(0, 5));
      }
    }

    return [...new Set(tags)]; // 去重
  }

  /**
   * 查找已存在的条目
   */
  private async findExistingEntry(
    title: string,
    tenantId: string,
    category: KnowledgeCategory
  ): Promise<KnowledgeEntry | null> {
    const entries = await this.kb.getEntriesByCategory(category, tenantId, { limit: 100 });

    return entries.find(e => e.title === title) || null;
  }
}

/**
 * 快捷导入方法
 */
export async function importKnowledge(
  kb: IKnowledgeBase,
  config: ImportConfig
): Promise<ImportResult> {
  const importer = new KnowledgeImporter(kb);
  return importer.importFromDirectory(config);
}

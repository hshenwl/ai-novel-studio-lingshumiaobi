/**
 * 本地知识库完整实现 - 第3部分(约束清单、索引管理、版本管理)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  KnowledgeEntry,
  KnowledgeVersion,
  VersionChange,
  ChangeType,
  VersionStatus,
  IndexStatus,
  IndexConfig,
  IndexingStatus,
  ConstraintList,
  ConstraintItem,
  ConstraintPriority,
  ConstraintType,
  ConstraintStatus,
  CreationScene,
  CreationPhase,
  KnowledgeCategory
} from '../types';
import { LocalKnowledgeBaseImpl } from './LocalKnowledgeBaseImpl';
import { SceneStrategy } from '../strategies/SceneStrategy';

export class LocalKnowledgeBaseFull extends LocalKnowledgeBaseImpl {
  private strategy: SceneStrategy;

  constructor() {
    super();
    this.strategy = new SceneStrategy();
  }

  // ============ 约束清单 ============

  async generateConstraints(
    novelId: string,
    scene: CreationScene,
    tenantId: string,
    userId: string
  ): Promise<ConstraintList> {
    if (!this.db) throw new Error('Database not initialized');

    // 获取场景推荐
    const recommendation = await this.getRecommendation(scene, tenantId);

    // 构建约束项
    const constraints: ConstraintItem[] = recommendation.suggestedEntries.map((entry, index) => ({
      id: uuidv4(),
      entryId: entry.id,
      category: entry.category,
      title: entry.title,
      content: entry.summary || entry.content.substring(0, 500),
      priority: index < 3 ? ConstraintPriority.CRITICAL : ConstraintPriority.HIGH,
      type: this.inferConstraintType(entry.category),
      sourceFile: entry.source,
      applied: false,
      violated: false
    }));

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO constraint_lists (
        id, tenant_id, user_id, novel_id, scene, phase, constraints, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, tenantId, userId, novelId, scene, CreationPhase.PLANNING,
      JSON.stringify(constraints), now, now
    );

    return {
      id, tenantId, userId, novelId, scene,
      phase: CreationPhase.PLANNING,
      constraints,
      status: ConstraintStatus.PENDING,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async getConstraintList(id: string, tenantId: string): Promise<ConstraintList | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM constraint_lists WHERE id = ? AND tenant_id = ?
    `);

    const row = stmt.get(id, tenantId) as any;
    if (!row) return null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      novelId: row.novel_id,
      scene: row.scene as CreationScene,
      phase: row.phase as CreationPhase,
      constraints: JSON.parse(row.constraints) as ConstraintItem[],
      status: row.status as ConstraintStatus,
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async updateConstraintStatus(
    listId: string,
    constraintId: string,
    tenantId: string,
    updates: { applied?: boolean; violated?: boolean; violationNote?: string }
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const list = await this.getConstraintList(listId, tenantId);
    if (!list) throw new Error(`Constraint list ${listId} not found`);

    const constraint = list.constraints.find(c => c.id === constraintId);
    if (!constraint) throw new Error(`Constraint ${constraintId} not found`);

    if (updates.applied !== undefined) constraint.applied = updates.applied;
    if (updates.violated !== undefined) constraint.violated = updates.violated;
    if (updates.violationNote !== undefined) constraint.violationNote = updates.violationNote;

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE constraint_lists
      SET constraints = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `);

    stmt.run(JSON.stringify(list.constraints), now, listId, tenantId);
  }

  private inferConstraintType(category: KnowledgeCategory): ConstraintType {
    const mapping: Partial<Record<KnowledgeCategory, ConstraintType>> = {
      [KnowledgeCategory.WORLD]: ConstraintType.SETTING,
      [KnowledgeCategory.CHARACTERS]: ConstraintType.CHARACTER,
      [KnowledgeCategory.PLOTS]: ConstraintType.PLOT,
      [KnowledgeCategory.TECHNIQUES]: ConstraintType.TECHNIQUE,
      [KnowledgeCategory.TUTORIALS]: ConstraintType.TECHNIQUE,
      [KnowledgeCategory.OPERATIONS]: ConstraintType.BUSINESS,
      [KnowledgeCategory.SCENES]: ConstraintType.STYLE
    };
    return mapping[category] || ConstraintType.TECHNIQUE;
  }

  // ============ 索引管理 ============

  async createIndex(tenantId: string, categories?: KnowledgeCategory[]): Promise<void> {
    const cats = categories || Object.values(KnowledgeCategory);

    for (const category of cats) {
      const stmt = this.db!.prepare(`
        INSERT OR REPLACE INTO index_status (tenant_id, category, status)
        VALUES (?, ?, 'indexing')
      `);
      stmt.run(tenantId, category);
    }
  }

  async updateIndex(tenantId: string, entryId: string): Promise<void> {
    const entry = await this.getEntry(entryId, tenantId);
    if (entry) {
      await this.updateFTSIndex(entryId, entry);
    }
  }

  async rebuildIndex(tenantId: string, categories?: KnowledgeCategory[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cats = categories || Object.values(KnowledgeCategory);

    this.db.exec(`DELETE FROM knowledge_entries_fts WHERE tenant_id = '${tenantId}'`);

    for (const category of cats) {
      const entries = await this.getEntriesByCategory(category, tenantId, { limit: 10000 });

      for (const entry of entries) {
        await this.updateFTSIndex(entry.id, entry);
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO index_status (tenant_id, category, total_entries, indexed_entries, status, last_indexed_at)
        VALUES (?, ?, ?, ?, 'completed', ?)
      `);
      stmt.run(tenantId, category, entries.length, entries.length, new Date().toISOString());
    }
  }

  async getIndexStatus(tenantId: string, category: KnowledgeCategory): Promise<IndexStatus> {
    const stmt = this.db!.prepare(`
      SELECT * FROM index_status WHERE tenant_id = ? AND category = ?
    `);

    const row = stmt.get(tenantId, category) as any;

    return {
      tenantId,
      category,
      totalEntries: row?.total_entries || 0,
      indexedEntries: row?.indexed_entries || 0,
      pendingEntries: row?.pending_entries || 0,
      status: (row?.status || IndexingStatus.IDLE) as IndexingStatus,
      lastIndexedAt: row?.last_indexed_at ? new Date(row.last_indexed_at) : undefined,
      error: row?.error,
      progress: row?.progress || 0
    };
  }

  async configureIndex(config: IndexConfig): Promise<void> {
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS index_config (tenant_id TEXT PRIMARY KEY, config TEXT NOT NULL)
    `);

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO index_config (tenant_id, config) VALUES (?, ?)
    `);
    stmt.run(config.tenantId, JSON.stringify(config));
  }

  // ============ 版本管理 ============

  async createVersion(
    tenantId: string,
    userId: string,
    changes: Array<{ entryId: string; changeType: string; reason?: string }>
  ): Promise<KnowledgeVersion> {
    if (!this.db) throw new Error('Database not initialized');

    // 获取当前版本号
    const versionStmt = this.db.prepare(`
      SELECT MAX(version_code) as max_version FROM knowledge_versions WHERE tenant_id = ?
    `);
    const versionRow = versionStmt.get(tenantId) as any;
    const versionCode = (versionRow?.max_version || 0) + 1;
    const version = `v${versionCode}`;

    const id = uuidv4();
    const now = new Date().toISOString();

    const versionChanges: VersionChange[] = changes.map(c => ({
      entryId: c.entryId,
      changeType: c.changeType as ChangeType,
      changeReason: c.reason
    }));

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_versions (
        id, tenant_id, user_id, version, version_code, changes, created_at, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);

    stmt.run(
      id, tenantId, userId, version, versionCode,
      JSON.stringify(versionChanges), now, userId
    );

    return {
      id,
      tenantId,
      userId,
      version,
      versionCode,
      changes: versionChanges,
      changeSummary: `${changes.length} changes`,
      createdAt: new Date(now),
      createdBy: userId,
      tags: [],
      status: VersionStatus.PUBLISHED
    };
  }

  async getVersionHistory(
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeVersion[]> {
    if (!this.db) return [];

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_versions
      WHERE tenant_id = ?
      ORDER BY version_code DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(tenantId, limit, offset) as any[];

    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      version: row.version,
      versionCode: row.version_code,
      changes: JSON.parse(row.changes) as VersionChange[],
      changeSummary: row.change_summary,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      tags: JSON.parse(row.tags || '[]'),
      status: row.status as VersionStatus
    }));
  }

  async rollbackToVersion(versionId: string, tenantId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 获取版本信息
    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_versions WHERE id = ? AND tenant_id = ?
    `);
    const row = stmt.get(versionId, tenantId) as any;

    if (!row) throw new Error(`Version ${versionId} not found`);

    const changes = JSON.parse(row.changes) as VersionChange[];

    // 标记版本为已回滚
    const updateStmt = this.db.prepare(`
      UPDATE knowledge_versions SET status = 'rolled_back' WHERE id = ?
    `);
    updateStmt.run(versionId);

    // 注意: 实际的回滚操作需要根据业务逻辑实现
    // 这里只做版本标记,不实际修改数据
  }

  // ============ 场景推荐 ============

  async getRecommendation(scene: CreationScene, tenantId: string) {
    const config = this.strategy.getRecommendedCategories(scene);

    // 获取推荐分类的条目
    const entriesMap = new Map<KnowledgeCategory, KnowledgeEntry[]>();

    for (const cat of config) {
      const entries = await this.getEntriesByCategory(cat.category, tenantId, { limit: 10 });
      entriesMap.set(cat.category, entries);
    }

    return this.strategy.getRecommendation(scene, entriesMap);
  }
}

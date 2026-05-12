/**
 * 本地知识库完整实现 - 第2部分(条目管理和搜索)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  KnowledgeEntry,
  KnowledgeReference,
  ConstraintList,
  ConstraintItem,
  ConstraintPriority,
  SearchRequest,
  SearchResult,
  SearchResultEntry,
  IndexStatus,
  IndexConfig,
  CreationScene,
  CreationPhase,
  KnowledgeCategory,
  SearchMode,
  ReferenceContext,
  ConstraintStatus,
  EntryStatus
} from '../types';
import { ReferenceStats } from '../interfaces';
import { LocalKnowledgeBase } from './LocalKnowledgeBase';

export class LocalKnowledgeBaseImpl extends LocalKnowledgeBase {
  // ============ 条目管理 ============

  async createEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntry> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_entries (
        id, tenant_id, user_id, category, sub_category, tags,
        title, content, summary, source, author, version,
        created_at, updated_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.tenantId,
      entry.userId,
      entry.category,
      entry.subCategory || null,
      JSON.stringify(entry.tags || []),
      entry.title,
      entry.content,
      entry.summary || null,
      entry.source || null,
      entry.author || null,
      entry.version || 1,
      now,
      now,
      entry.status || EntryStatus.PUBLISHED
    );

    await this.updateFTSIndex(id, { ...entry, id } as KnowledgeEntry);

    return {
      ...entry,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async createEntries(entries: Array<Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<KnowledgeEntry[]> {
    const results: KnowledgeEntry[] = [];

    const insertMany = this.db!.transaction((items: typeof entries) => {
      for (const entry of items) {
        const result = this.createEntrySync(entry);
        results.push(result);
      }
    });

    insertMany(entries);
    return results;
  }

  private createEntrySync(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeEntry {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db!.prepare(`
      INSERT INTO knowledge_entries (
        id, tenant_id, user_id, category, sub_category, tags,
        title, content, summary, source, author, version,
        created_at, updated_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.tenantId,
      entry.userId,
      entry.category,
      entry.subCategory || null,
      JSON.stringify(entry.tags || []),
      entry.title,
      entry.content,
      entry.summary || null,
      entry.source || null,
      entry.author || null,
      entry.version || 1,
      now,
      now,
      entry.status || EntryStatus.PUBLISHED
    );

    return {
      ...entry,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async getEntry(id: string, tenantId: string): Promise<KnowledgeEntry | null> {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_entries WHERE id = ? AND tenant_id = ?
    `);

    const row = stmt.get(id, tenantId) as any;
    return row ? this.rowToEntry(row) : null;
  }

  async getEntries(ids: string[], tenantId: string): Promise<KnowledgeEntry[]> {
    if (!this.db || ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_entries WHERE id IN (${placeholders}) AND tenant_id = ?
    `);

    const rows = stmt.all(...ids, tenantId) as any[];
    return rows.map(row => this.rowToEntry(row));
  }

  async updateEntry(id: string, tenantId: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getEntry(id, tenantId);
    if (!existing) throw new Error(`Entry ${id} not found`);

    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.summary !== undefined) {
      fields.push('summary = ?');
      values.push(updates.summary);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    values.push(id, tenantId);

    const stmt = this.db.prepare(`
      UPDATE knowledge_entries SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?
    `);
    stmt.run(...values);

    const updated = { ...existing, ...updates, updatedAt: new Date(now) };
    await this.updateFTSIndex(id, updated);

    return updated;
  }

  async deleteEntry(id: string, tenantId: string): Promise<boolean> {
    if (!this.db) return false;

    const stmt = this.db.prepare(`DELETE FROM knowledge_entries WHERE id = ? AND tenant_id = ?`);
    const result = stmt.run(id, tenantId);

    const ftsStmt = this.db.prepare(`DELETE FROM knowledge_entries_fts WHERE id = ?`);
    ftsStmt.run(id);

    return result.changes > 0;
  }

  async getEntriesByCategory(
    category: KnowledgeCategory,
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeEntry[]> {
    if (!this.db) return [];

    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_entries
      WHERE category = ? AND tenant_id = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(category, tenantId, limit, offset) as any[];
    return rows.map(row => this.rowToEntry(row));
  }

  // ============ 检索功能 ============

  async search(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.db) throw new Error('Database not initialized');

    try {
      return await this.ftsSearch(request, startTime);
    } catch {
      return this.fallbackSearch(request, startTime);
    }
  }

  private async ftsSearch(request: SearchRequest, startTime: number): Promise<SearchResult> {
    const limit = request.limit || 20;
    const offset = request.offset || 0;

    let ftsQuery = `
      SELECT id, bm25(knowledge_entries_fts) as score
      FROM knowledge_entries_fts
      WHERE knowledge_entries_fts MATCH ? AND tenant_id = ?
    `;

    const params: any[] = [request.query, request.tenantId];

    if (request.categories && request.categories.length > 0) {
      const catFilter = request.categories.map(() => 'category = ?').join(' OR ');
      ftsQuery += ` AND (${catFilter})`;
      params.push(...request.categories);
    }

    ftsQuery += ' ORDER BY score ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db!.prepare(ftsQuery);
    const rows = stmt.all(...params) as any[];

    const countStmt = this.db!.prepare(`
      SELECT COUNT(*) as total FROM knowledge_entries_fts
      WHERE knowledge_entries_fts MATCH ? AND tenant_id = ?
    `);
    const countRow = countStmt.get(request.query, request.tenantId) as any;
    const total = countRow?.total || 0;

    const entryIds = rows.map(r => r.id);
    const entries = entryIds.length > 0 ? await this.getEntries(entryIds, request.tenantId) : [];

    const searchResults: SearchResultEntry[] = entries.map(entry => {
      const row = rows.find(r => r.id === entry.id);
      return {
        ...entry,
        score: row ? -row.score : 0,
        highlights: this.extractHighlights(entry.content, request.query)
      };
    });

    return {
      entries: searchResults,
      total,
      hasMore: offset + limit < total,
      query: request.query,
      mode: SearchMode.FTS,
      executionTime: Date.now() - startTime
    };
  }

  private async fallbackSearch(request: SearchRequest, startTime: number): Promise<SearchResult> {
    const limit = request.limit || 20;
    const offset = request.offset || 0;

    let sql = `SELECT * FROM knowledge_entries WHERE tenant_id = ?`;
    const params: any[] = [request.tenantId];

    if (request.categories && request.categories.length > 0) {
      const placeholders = request.categories.map(() => '?').join(',');
      sql += ` AND category IN (${placeholders})`;
      params.push(...request.categories);
    }

    const searchPattern = `%${request.query}%`;
    sql += ` AND (title LIKE ? OR content LIKE ? OR summary LIKE ?)`;
    params.push(searchPattern, searchPattern, searchPattern);

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db!.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return {
      entries: rows.map(row => this.rowToEntry(row)),
      total: rows.length,
      hasMore: false,
      query: request.query,
      mode: SearchMode.FTS,
      executionTime: Date.now() - startTime
    };
  }

  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const words = query.toLowerCase().split(/\s+/);

    for (const word of words) {
      const index = content.toLowerCase().indexOf(word);
      if (index >= 0) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + word.length + 50);
        highlights.push(content.substring(start, end));
        if (highlights.length >= 3) break;
      }
    }

    return highlights;
  }

  // ============ 引用管理 ============

  async recordReference(reference: Omit<KnowledgeReference, 'id' | 'createdAt'>): Promise<KnowledgeReference> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_references (
        id, tenant_id, user_id, entry_id, entry_title, category,
        context, node_id, node_type, quoted_text, applied_constraint,
        created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      reference.tenantId,
      reference.userId,
      reference.entryId,
      reference.entryTitle,
      reference.category,
      JSON.stringify(reference.context),
      reference.nodeId,
      reference.nodeType,
      reference.quotedText || null,
      reference.appliedConstraint || null,
      now,
      reference.createdBy
    );

    return { ...reference, id, createdAt: new Date(now) };
  }

  async getReferenceHistory(
    nodeId: string,
    tenantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<KnowledgeReference[]> {
    if (!this.db) return [];

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_references
      WHERE node_id = ? AND tenant_id = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(nodeId, tenantId, limit, offset) as any[];

    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      entryId: row.entry_id,
      entryTitle: row.entry_title,
      category: row.category as KnowledgeCategory,
      context: JSON.parse(row.context) as ReferenceContext,
      nodeId: row.node_id,
      nodeType: row.node_type,
      quotedText: row.quoted_text,
      appliedConstraint: row.applied_constraint,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by
    }));
  }

  async getEntryReferenceStats(entryId: string, tenantId: string): Promise<ReferenceStats> {
    if (!this.db) {
      return { entryId, totalReferences: 0, recentReferences: 0, topScenes: [], topNodes: [] };
    }

    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_references WHERE entry_id = ? AND tenant_id = ?
    `);
    const totalRow = totalStmt.get(entryId, tenantId) as any;

    const recentStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_references
      WHERE entry_id = ? AND tenant_id = ? AND created_at >= datetime('now', '-7 days')
    `);
    const recentRow = recentStmt.get(entryId, tenantId) as any;

    const sceneStmt = this.db.prepare(`
      SELECT json_extract(context, '$.scene') as scene, COUNT(*) as count
      FROM knowledge_references WHERE entry_id = ? AND tenant_id = ?
      GROUP BY scene ORDER BY count DESC LIMIT 5
    `);
    const sceneRows = sceneStmt.all(entryId, tenantId) as any[];

    const nodeStmt = this.db.prepare(`
      SELECT node_id, node_type, COUNT(*) as count
      FROM knowledge_references WHERE entry_id = ? AND tenant_id = ?
      GROUP BY node_id ORDER BY count DESC LIMIT 5
    `);
    const nodeRows = nodeStmt.all(entryId, tenantId) as any[];

    return {
      entryId,
      totalReferences: totalRow?.count || 0,
      recentReferences: recentRow?.count || 0,
      topScenes: sceneRows.map(r => ({ scene: r.scene as CreationScene, count: r.count })),
      topNodes: nodeRows.map(r => ({ nodeId: r.node_id, nodeType: r.node_type, count: r.count }))
    };
  }
}

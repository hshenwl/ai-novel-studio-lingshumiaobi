/**
 * 本地知识库实现 - SQLite + FTS5 (第1部分)
 * 支持全文检索,不依赖外部服务
 */

import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  KnowledgeEntry,
  KnowledgeCategory,
  KnowledgeSource,
  EntryStatus,
  KnowledgeBaseConfig
} from '../types';
import { IKnowledgeBase } from '../interfaces';

export class LocalKnowledgeBase implements IKnowledgeBase {
  protected db: Database.Database | null = null;
  protected config: KnowledgeBaseConfig | null = null;
  protected knowledgeDir: string = '';

  async initialize(config: KnowledgeBaseConfig): Promise<void> {
    this.config = config;
    this.knowledgeDir = config.local?.knowledgeDir || path.join(process.cwd(), 'knowledge');

    const dbPath = config.local?.dbPath || path.join(process.cwd(), 'data', 'knowledge.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    await this.createTables();

    if (config.local?.enableFTS !== false) {
      await this.createFTSIndex();
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getSource(): KnowledgeSource {
    return KnowledgeSource.LOCAL;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  protected async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        sub_category TEXT,
        tags TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        source TEXT,
        author TEXT,
        version INTEGER DEFAULT 1,
        embedding BLOB,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        indexed_at TEXT,
        status TEXT DEFAULT 'published'
      );

      CREATE INDEX IF NOT EXISTS idx_entries_tenant ON knowledge_entries(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_entries_category ON knowledge_entries(category, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_entries_status ON knowledge_entries(status, tenant_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_references (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        entry_id TEXT NOT NULL,
        entry_title TEXT NOT NULL,
        category TEXT NOT NULL,
        context TEXT NOT NULL,
        node_id TEXT NOT NULL,
        node_type TEXT NOT NULL,
        quoted_text TEXT,
        applied_constraint TEXT,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_refs_entry ON knowledge_references(entry_id, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_refs_node ON knowledge_references(node_id, tenant_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS constraint_lists (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        novel_id TEXT NOT NULL,
        scene TEXT NOT NULL,
        phase TEXT NOT NULL,
        constraints TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        applied_at TEXT,
        verified_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_constraints_novel ON constraint_lists(novel_id, tenant_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_versions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        version TEXT NOT NULL,
        version_code INTEGER NOT NULL,
        changes TEXT NOT NULL,
        change_summary TEXT,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        tags TEXT,
        status TEXT DEFAULT 'published'
      );

      CREATE INDEX IF NOT EXISTS idx_versions_tenant ON knowledge_versions(tenant_id);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS index_status (
        tenant_id TEXT NOT NULL,
        category TEXT NOT NULL,
        total_entries INTEGER DEFAULT 0,
        indexed_entries INTEGER DEFAULT 0,
        pending_entries INTEGER DEFAULT 0,
        status TEXT DEFAULT 'idle',
        last_indexed_at TEXT,
        error TEXT,
        progress REAL DEFAULT 0,
        PRIMARY KEY (tenant_id, category)
      )
    `);
  }

  protected async createFTSIndex(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_entries_fts USING fts5(
        id UNINDEXED,
        tenant_id UNINDEXED,
        category UNINDEXED,
        title,
        content,
        summary,
        tags,
        tokenize = 'unicode61'
      )
    `);
  }

  protected rowToEntry(row: any): KnowledgeEntry {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      category: row.category as KnowledgeCategory,
      subCategory: row.sub_category,
      tags: JSON.parse(row.tags || '[]'),
      title: row.title,
      content: row.content,
      summary: row.summary,
      source: row.source,
      author: row.author,
      version: row.version,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      indexedAt: row.indexed_at ? new Date(row.indexed_at) : undefined,
      status: row.status as EntryStatus
    };
  }

  protected async updateFTSIndex(id: string, entry: KnowledgeEntry): Promise<void> {
    if (!this.db) return;

    const deleteStmt = this.db.prepare(`DELETE FROM knowledge_entries_fts WHERE id = ?`);
    deleteStmt.run(id);

    const insertStmt = this.db.prepare(`
      INSERT INTO knowledge_entries_fts (id, tenant_id, category, title, content, summary, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      entry.tenantId,
      entry.category,
      entry.title,
      entry.content,
      entry.summary || '',
      (entry.tags || []).join(' ')
    );
  }
}

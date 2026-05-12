-- SQLite 初始化脚本
-- AI Novel Studio Database Schema
-- 支持多租户架构

-- ==================== 项目管理 ====================

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    target_words INTEGER DEFAULT 0,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0
);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);

-- 世界设定表
CREATE TABLE IF NOT EXISTS world_settings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_world_settings_project_id ON world_settings(project_id);
CREATE INDEX idx_world_settings_tenant_id ON world_settings(tenant_id);
CREATE INDEX idx_world_settings_category ON world_settings(category);
CREATE INDEX idx_world_settings_deleted_at ON world_settings(deleted_at);

-- 卷表
CREATE TABLE IF NOT EXISTS volumes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    target_words INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, number)
);

CREATE INDEX idx_volumes_project_id ON volumes(project_id);
CREATE INDEX idx_volumes_tenant_id ON volumes(tenant_id);
CREATE INDEX idx_volumes_deleted_at ON volumes(deleted_at);

-- 章纲表
CREATE TABLE IF NOT EXISTS chapter_outlines (
    id TEXT PRIMARY KEY,
    volume_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    plot_points TEXT,
    characters TEXT,
    foreshadows TEXT,
    metadata TEXT,
    status TEXT DEFAULT 'draft',
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE,
    UNIQUE(volume_id, number)
);

CREATE INDEX idx_chapter_outlines_project_id ON chapter_outlines(project_id);
CREATE INDEX idx_chapter_outlines_volume_id ON chapter_outlines(volume_id);
CREATE INDEX idx_chapter_outlines_tenant_id ON chapter_outlines(tenant_id);
CREATE INDEX idx_chapter_outlines_deleted_at ON chapter_outlines(deleted_at);

-- 章节正文表
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    volume_id TEXT NOT NULL,
    outline_id TEXT,
    project_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE,
    FOREIGN KEY (outline_id) REFERENCES chapter_outlines(id),
    UNIQUE(volume_id, number)
);

CREATE INDEX idx_chapters_project_id ON chapters(project_id);
CREATE INDEX idx_chapters_volume_id ON chapters(volume_id);
CREATE INDEX idx_chapters_tenant_id ON chapters(tenant_id);
CREATE INDEX idx_chapters_deleted_at ON chapters(deleted_at);

-- ==================== 角色管理 ====================

-- 角色表
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    alias TEXT,
    gender TEXT,
    age TEXT,
    profession TEXT,
    organization TEXT,
    appearance TEXT,
    personality TEXT,
    background TEXT,
    abilities TEXT,
    metadata TEXT,
    avatar TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_characters_tenant_id ON characters(tenant_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_deleted_at ON characters(deleted_at);

-- 组织表
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    level TEXT,
    description TEXT,
    members TEXT,
    structure TEXT,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_organizations_project_id ON organizations(project_id);
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at);

-- 职业等级表
CREATE TABLE IF NOT EXISTS professions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    levels TEXT NOT NULL,
    description TEXT,
    abilities TEXT,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_professions_project_id ON professions(project_id);
CREATE INDEX idx_professions_tenant_id ON professions(tenant_id);
CREATE INDEX idx_professions_deleted_at ON professions(deleted_at);

-- 关系表
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    character_id_a TEXT NOT NULL,
    character_id_b TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    description TEXT,
    bidirectional INTEGER DEFAULT 0,
    strength INTEGER DEFAULT 0,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id_a) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id_b) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_relationships_project_id ON relationships(project_id);
CREATE INDEX idx_relationships_character_id_a ON relationships(character_id_a);
CREATE INDEX idx_relationships_character_id_b ON relationships(character_id_b);
CREATE INDEX idx_relationships_tenant_id ON relationships(tenant_id);
CREATE INDEX idx_relationships_deleted_at ON relationships(deleted_at);

-- ==================== 伏笔管理 ====================

-- 伏笔表
CREATE TABLE IF NOT EXISTS foreshadows (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    planted_chapter TEXT,
    resolved_chapter TEXT,
    status TEXT DEFAULT 'planted',
    importance INTEGER DEFAULT 0,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_foreshadows_project_id ON foreshadows(project_id);
CREATE INDEX idx_foreshadows_status ON foreshadows(status);
CREATE INDEX idx_foreshadows_tenant_id ON foreshadows(tenant_id);
CREATE INDEX idx_foreshadows_deleted_at ON foreshadows(deleted_at);

-- ==================== Hook系统 ====================

-- Hook表
CREATE TABLE IF NOT EXISTS hooks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    config TEXT NOT NULL,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_hooks_project_id ON hooks(project_id);
CREATE INDEX idx_hooks_type ON hooks(type);
CREATE INDEX idx_hooks_tenant_id ON hooks(tenant_id);
CREATE INDEX idx_hooks_deleted_at ON hooks(deleted_at);

-- ==================== 工作流 ====================

-- 工作流运行表
CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    config TEXT,
    context TEXT,
    result TEXT,
    error TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_runs_project_id ON workflow_runs(project_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_tenant_id ON workflow_runs(tenant_id);
CREATE INDEX idx_workflow_runs_deleted_at ON workflow_runs(deleted_at);

-- 工作流步骤输出表
CREATE TABLE IF NOT EXISTS workflow_step_outputs (
    id TEXT PRIMARY KEY,
    workflow_run_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    input TEXT,
    output TEXT,
    status TEXT DEFAULT 'pending',
    error TEXT,
    duration INTEGER DEFAULT 0,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_step_outputs_workflow_run_id ON workflow_step_outputs(workflow_run_id);
CREATE INDEX idx_workflow_step_outputs_tenant_id ON workflow_step_outputs(tenant_id);
CREATE INDEX idx_workflow_step_outputs_deleted_at ON workflow_step_outputs(deleted_at);

-- ==================== 审核与修订 ====================

-- 审核报告表
CREATE TABLE IF NOT EXISTS audit_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    chapter_id TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    report TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    issues TEXT,
    suggestions TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_reports_project_id ON audit_reports(project_id);
CREATE INDEX idx_audit_reports_chapter_id ON audit_reports(chapter_id);
CREATE INDEX idx_audit_reports_status ON audit_reports(status);
CREATE INDEX idx_audit_reports_tenant_id ON audit_reports(tenant_id);
CREATE INDEX idx_audit_reports_deleted_at ON audit_reports(deleted_at);

-- 修订记录表
CREATE TABLE IF NOT EXISTS revision_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    audit_id TEXT,
    revision_type TEXT NOT NULL,
    before TEXT NOT NULL,
    after TEXT NOT NULL,
    reason TEXT,
    metadata TEXT,
    
    -- 多租户字段
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 0,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_revision_records_project_id ON revision_records(project_id);
CREATE INDEX idx_revision_records_chapter_id ON revision_records(chapter_id);
CREATE INDEX idx_revision_records_audit_id ON revision_records(audit_id);
CREATE INDEX idx_revision_records_tenant_id ON revision_records(tenant_id);
CREATE INDEX idx_revision_records_deleted_at ON revision_records(deleted_at);

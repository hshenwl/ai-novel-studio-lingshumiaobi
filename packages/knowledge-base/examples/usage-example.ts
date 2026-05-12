/**
 * 知识库系统使用示例
 */

import {
  getKnowledgeBase,
  importKnowledge,
  KnowledgeSource,
  KnowledgeCategory,
  CreationScene,
  SearchMode,
  ConstraintPriority
} from '../src';

async function main() {
  console.log('=== AI小说创作系统 - 知识库示例 ===\n');

  // 1. 初始化知识库
  console.log('1. 初始化知识库...');
  const kb = await getKnowledgeBase({
    tenantId: 'demo-tenant',
    source: KnowledgeSource.LOCAL,
    local: {
      dbPath: './data/demo-knowledge.db',
      knowledgeDir: 'H:/小说/26050402/knowledge',
      enableFTS: true
    }
  });

  // 2. 导入知识库(如果目录存在)
  const knowledgeDir = 'H:/小说/26050402/knowledge';
  const fs = await import('fs');
  if (fs.existsSync(knowledgeDir)) {
    console.log('\n2. 从文件导入知识库...');
    const result = await importKnowledge(kb, {
      knowledgeDir,
      tenantId: 'demo-tenant',
      userId: 'demo-user',
      batchSize: 10
    });

    console.log(`导入结果:`);
    console.log(`  - 总文件: ${result.total}`);
    console.log(`  - 成功: ${result.imported}`);
    console.log(`  - 跳过: ${result.skipped}`);
    console.log(`  - 错误: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n错误详情:');
      result.errors.slice(0, 5).forEach(err => {
        console.log(`  - ${err.file}: ${err.error}`);
      });
    }
  }

  // 3. 搜索知识库
  console.log('\n3. 搜索知识库...');
  const searchResult = await kb.search({
    tenantId: 'demo-tenant',
    userId: 'demo-user',
    query: '伏笔',
    categories: [KnowledgeCategory.TUTORIALS, KnowledgeCategory.TECHNIQUES],
    mode: SearchMode.FTS,
    limit: 5
  });

  console.log(`搜索结果: ${searchResult.entries.length}/${searchResult.total}`);
  searchResult.entries.forEach((entry, idx) => {
    console.log(`  ${idx + 1}. ${entry.title} (得分: ${entry.score.toFixed(2)})`);
    if (entry.highlights && entry.highlights.length > 0) {
      console.log(`     高亮: ${entry.highlights[0].substring(0, 50)}...`);
    }
  });
  console.log(`  执行时间: ${searchResult.executionTime}ms`);

  // 4. 场景推荐
  console.log('\n4. 场景推荐 - 正文生成...');
  const recommendation = await kb.getRecommendation(
    CreationScene.CONTENT_GENERATION,
    'demo-tenant'
  );

  console.log('推荐分类:');
  recommendation.categories.forEach(cat => {
    console.log(`  - ${cat.category} (${cat.priority}): ${cat.reason}`);
  });

  console.log(`\n推荐条目: ${recommendation.suggestedEntries.length}条`);
  recommendation.suggestedEntries.slice(0, 3).forEach(entry => {
    console.log(`  - ${entry.title}`);
  });

  // 5. 生成约束清单
  console.log('\n5. 生成约束清单...');
  const constraints = await kb.generateConstraints(
    'novel-demo-001',
    CreationScene.CONTENT_GENERATION,
    'demo-tenant',
    'demo-user'
  );

  console.log(`约束清单 ID: ${constraints.id}`);
  console.log(`场景: ${constraints.scene}`);
  console.log(`约束数量: ${constraints.constraints.length}`);

  console.log('\n约束项 (前5条):');
  constraints.constraints.slice(0, 5).forEach((c, idx) => {
    console.log(`  ${idx + 1}. [${c.priority}] ${c.title}`);
    console.log(`     类型: ${c.type}`);
    console.log(`     来源: ${c.sourceFile || 'N/A'}`);
  });

  // 6. 记录引用
  console.log('\n6. 记录知识库引用...');
  if (searchResult.entries.length > 0) {
    const entry = searchResult.entries[0];
    const reference = await kb.recordReference({
      tenantId: 'demo-tenant',
      userId: 'demo-user',
      entryId: entry.id,
      entryTitle: entry.title,
      category: entry.category,
      context: {
        scene: CreationScene.CONTENT_GENERATION,
        phase: 'writing' as any,
        action: 'writing'
      },
      nodeId: 'chapter-001',
      nodeType: 'chapter',
      quotedText: entry.content.substring(0, 100),
      appliedConstraint: '写作时注意伏笔设置',
      createdBy: 'demo-user'
    });

    console.log(`引用已记录: ${reference.id}`);
  }

  // 7. 查看引用历史
  console.log('\n7. 查看引用历史...');
  const refHistory = await kb.getReferenceHistory('chapter-001', 'demo-tenant');
  console.log(`章节 chapter-001 的引用历史: ${refHistory.length}条`);
  refHistory.forEach(ref => {
    console.log(`  - ${ref.entryTitle} (${ref.createdAt.toLocaleString()})`);
  });

  // 8. 索引状态
  console.log('\n8. 索引状态...');
  const indexStatus = await kb.getIndexStatus('demo-tenant', KnowledgeCategory.TUTORIALS);
  console.log(`分类: ${indexStatus.category}`);
  console.log(`状态: ${indexStatus.status}`);
  console.log(`总数: ${indexStatus.totalEntries}`);
  console.log(`已索引: ${indexStatus.indexedEntries}`);

  // 9. 创建版本
  console.log('\n9. 创建知识库版本...');
  const version = await kb.createVersion(
    'demo-tenant',
    'demo-user',
    [
      { entryId: 'entry-001', changeType: 'created', reason: '新增教程' }
    ]
  );
  console.log(`版本已创建: ${version.version} (${version.versionCode})`);

  // 10. 清理
  console.log('\n10. 关闭知识库...');
  await kb.close();
  console.log('完成!');
}

// 运行示例
main().catch(console.error);

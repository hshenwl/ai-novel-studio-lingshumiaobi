# Prompt 模板文件

此目录存放各种 Prompt 模板，用于优化 AI 生成效果。

## 模板文件格式

模板文件使用 `.prompt.md` 格式，支持变量替换：

- `{{variable}}` - 简单变量
- `{{#if condition}}...{{/if}}` - 条件渲染
- `{{#each items}}...{{/each}}` - 循环渲染

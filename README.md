# Notion Workspace - Codex Plugin

将你的 Notion 工作区与 Codex 连接。搜索页面、查询数据库、创建和更新内容 — 一切在对话中完成。
Codex-Access-Notion-via-a-local-MCP-server-using-the-Notion-API-Key
Notion Workspace Codex Plugin — Connect your Notion workspace to Codex and manage your content through natural conversation. Here's a GitHub repository description in English:

Notion Workspace Codex Plugin — Connect your Notion workspace to Codex and manage your content through natural conversation.

This plugin brings Notion's official API into Codex via a local MCP server, enabling you to search pages, query databases, create and update content, and capture knowledge — all without leaving your coding workflow.

Key capabilities:

Search your entire Notion workspace by keyword
Read page content, block children, and database entries
Create pages under any parent or insert rows into databases
Update existing pages with new content blocks or property changes
Append formatted text, lists, code blocks, and more
The plugin ships with five built-in Skills that guide Codex on how to work intelligently with Notion: Knowledge Capture, Meeting Intelligence, Research Documentation, Spec-to-Implementation tracking, and a general workspace integration guide.

Security: Your Notion API key is never stored in code. It's read from the NOTION_API_KEY environment variable at runtime, making it safe to share and version-control this repository.

Quick setup: Provide your Notion API key (free from notion.so/my-integrations), share it with your target pages, install the plugin in Codex, and start using Notion through natural language prompts.

Notion 工作空间 Codex 插件 将你的 Notion 工作空间接入 Codex，通过自然对话管理全部内容。 本插件依托本地 MCP 服务，对接 Notion 官方 API。你无需切换开发工作流，就能检索页面、查询数据库、新建 / 修改内容、沉淀知识库。 核心功能 检索：关键词搜索整个 Notion 工作空间 读取：查看页面正文、子内容块、数据库条目 创建：在任意父页面新建页面、向数据库插入数据行 更新：给已有页面新增内容块、修改条目属性 追加：插入格式化文本、列表、代码块等多种内容 插件内置 5 套预设能力模板，引导 Codex 智能操作 Notion：知识采集、会议信息整理、调研文档归档、需求落地进度追踪，以及通用工作空间接入指南。 安全机制 你的 Notion 密钥不会硬编码在代码中。程序运行时从环境变量NOTION_API_KEY读取密钥，仓库代码可放心开源、提交版本管理，不存在密钥泄露风险。 快速部署 前往 notion.so/my-integrations 免费生成 Notion API 密钥 将集成权限授予需要操作的 Notion 页面 在 Codex 中安装本插件 完成后即可通过自然语言指令操控 Notion。

## 📦 安装

### 前提条件

- **Codex 桌面端**
- **Node.js**（>= 18）
- **Notion API Key**（免费，去 [Notion Integrations](https://www.notion.so/my-integrations) 创建 Internal Integration）

### 快速安装

```bash
# 1. 克隆仓库
git clone https://github.com/你的用户名/notion-workspace-codex.git
cd notion-workspace-codex

# 2. 安装依赖
cd mcp-server && npm install && cd ..

# 3. 设置环境变量
# Windows (PowerShell):
$env:NOTION_API_KEY="你的secret_xxx"
# 或永久设置:
setx NOTION_API_KEY "你的secret_xxx"

# Mac / Linux:
export NOTION_API_KEY="你的secret_xxx"
```

### 在 Codex 中激活

1. 打开 Codex 桌面端
2. 进入 **Plugin 面板**
3. 添加本地插件：指向 `plugins/notion-workspace` 目录
4. 安装并启用

> 💡 **提示**：如果你已经安装过我此前帮你搭建的版本，重启 Codex 即可自动加载更新。

## 🔑 获取 API Key

1. 打开 https://www.notion.so/my-integrations
2. 点击 **"New integration"**
3. 填写名称（例如 "Codex"），选择关联的 workspace
4. 点击 **Submit** 创建
5. **复制**生成的内 Integration Token（`ntn_xxx` 或 `secret_xxx` 格式）
6. 在要操作的 **Notion 页面** 右上角 **Share → Invite**，添加此 Integration

## 🚀 功能

### MCP 工具（自动注入）

| 工具 | 功能 |
|------|------|
| `notion_search` | 搜索工作区中的页面和数据库 |
| `notion_retrieve_page` | 读取页面内容和属性 |
| `notion_query_database` | 筛选、排序数据库条目 |
| `notion_create_page` | 创建新页面 |
| `notion_append_blocks` | 追加内容块（文字、列表、代码等） |
| `notion_update_page_properties` | 更新页面属性 |

### Skills（智能提示）

插件内置 5 个 Skill 文件，Codex 会在相关场景自动读取：

- **main** — 总指引
- **knowledge-capture** — 知识捕捉
- **meeting-intelligence** — 会议纪要
- **research-documentation** — 研究归档
- **spec-to-implementation** — 需求到实现追踪

### 使用示例

```
"搜索我的 Notion 工作区"
"在 Engineering 文件夹下创建新页面叫 'API 设计'"
"查询我的 Tasks 数据库，找出所有高优先级任务"
"把这个代码分析结果保存到 Notion"
```

## 🏗 插件结构

```
plugins/notion-workspace/
├── .codex-plugin/
│   └── plugin.json          ← 插件清单
├── .mcp.json                ← MCP 服务器配置
├── mcp-server/
│   ├── index.js             ← MCP 服务器（Node.js）
│   ├── package.json
│   └── node_modules/
├── skills/
│   ├── main.md
│   ├── knowledge-capture.md
│   ├── meeting-intelligence.md
│   ├── research-documentation.md
│   └── spec-to-implementation.md
├── setup.bat                ← Windows 安装脚本
├── setup.sh                 ← Mac/Linux 安装脚本
├── .env.example
└── .gitignore
```

## ⚠️ 安全

- API Key 通过**环境变量**传入，**不会**硬编码在代码中
- 上传到 GitHub 不会暴露你的 Key
- `.gitignore` 已排除 `node_modules/` 和 `.env`

## 📄 许可

MIT

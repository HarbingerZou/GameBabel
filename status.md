# Status — Gamebabel

**当前阶段**：launched（内容流水线跑通，前端上线，但 SEO 流量尚未规模化）

## 已完成

- [x] Bilibili 全文抓取（标题/正文/图片/作者/互动数）
- [x] OCR 图片文字提取 + 合并回正文
- [x] AI 内容清洗 + 润色（DeepSeek）
- [x] 质量评分 + 主题自动分类
- [x] SEO title 生成（使用 topic-specific 关键词）
- [x] 6 语言翻译（保留 HTML 结构）
- [x] gamebabel-web 多语言路由 + sitemap.xml
- [x] Docker Compose 编排全套服务
- [x] 操作员仪表盘 + BullMQ 任务队列（backend/）

## 待完成

- [x] **前端缓存策略修复**：已改为 ISR `revalidate: 3600`，全站生效
- [x] MongoDB fallback URI 已指向 `gamebabel_prod`（server.ts:19）
- [x] 翻译词汇表注入：翻译时自动注入对应游戏 glossary，修正专有名词翻译
- [ ] **Bilibili 412 IP 封锁**：需要提供 `BILIBILI_COOKIE` 环境变量（见下方说明）
- [ ] Google Search Console 接入 + sitemap 提交
- [ ] 内容规模扩张：目标每游戏 × 每语言 50+ 篇（当前：108 processed / 505 translations）
- [ ] gamebabel-web 和 GameBabel/data-persistence 重复代码确认 source of truth

## 环境说明

- **本地 MongoDB**：开发/测试用，数据量小（46 篇原始，25 处理，21 翻译）
- **生产 MongoDB**：独立实例，承载真实 SEO 流量（Amplitude 数据来源于此）

## 当前阻塞

**Bilibili 412 IP 封锁**：容器出口 IP 被 Bilibili 风控封锁，所有抓取请求均失败。
解封方法（任选其一）：
1. **提供 Bilibili Cookie**（推荐）：用浏览器登录 bilibili.com → DevTools → Application → Cookies → 复制全部 cookie 字符串 → 设置 `BILIBILI_COOKIE=...` 环境变量后重启 crawler 容器
2. 等待 IP 自动解封（可能需要数小时到数天）
3. 在新服务器/新 IP 上重新部署

## 最近变更

- 2026-10-01：简化爬虫等待：删除通用 loading 扫描、HTML 长度兜底和额外固定等待，统一等待实际正文/列表内的文字或图片；空容器继续等待。
- 2026-02-15：SEO title 生成 + 翻译、Topic 管理系统重构、UI 增强
- 2026-05-17：分公司初始化，补建 AIMeta portfolio 战略记忆文件；Glossary 嵌入 Topic 模型，前端编辑页面，5 游戏词汇表初始化（43 terms），数据写入生产 DB
- 2026-05-17（续）：翻译 glossary 注入（content-translate.ts + by-name API）；前端 ISR 确认；MongoDB fallback URI 修正；Bilibili cookie 注入机制就绪（`BILIBILI_COOKIE` 环境变量）

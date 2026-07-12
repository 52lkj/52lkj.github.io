# 科技脉搏 · TechPulse

> 每日自动汇总全球 AI / 大模型 / 芯片 / 新产品领域核心热点，分享给他人查阅的展示型网页。

## 🌐 在线访问

GitHub Pages 部署后访问：  
`https://52lkj.github.io/tech-pulse/`

## ✨ 页面特点

- **深色科技风设计**：近黑底色 `#0A0E1A` + 渐变玻璃拟态卡片 + 三色分类体系（青·大模型 / 紫·芯片 / 绿·新产品）
- **完整交互**：分类筛选、实时搜索（标题/摘要/标签）、时间排序、卡片点击新窗跳转原文
- **响应式**：手机 / 平板 / 桌面自适应
- **单文件部署**：所有代码（HTML + CSS + JS + 20 条数据）打包在一个 `index.html` 里

## 📂 文件结构

```
.
├── index.html      # 主页面（含样式、脚本、20 条热点数据）
├── data.json       # 原始数据备份（用于后续脚本处理）
└── README.md       # 本文件
```

## 🛠 本地编辑

```bash
# 1. 克隆仓库
git clone https://github.com/52lkj/tech-pulse.git
cd tech-pulse

# 2. 直接用任意编辑器打开 index.html 修改
# 推荐：VS Code / Cursor / WebStorm
code index.html

# 3. 提交修改
git add .
git commit -m "update: 7-10 热点"
git push origin main

# 4. 几分钟后刷新 Pages 链接即可看到更新
```

## 📊 数据更新流程

1. 抓取当天（7-9 → 7-10 → ...）的科技热点
2. 整理成 20 条 JSON 数据（category / title / summary / source / url / tags）
3. 把数据替换 `index.html` 中 `const DATA = {...}` 部分
4. 提交 + 推送 → Pages 自动更新

## 🗓 数据快照

| 日期 | 热点数 | 主题 |
|------|--------|------|
| 2026-07-09 | 20 | AI 全双工时代：GPT-5.6、Grok 4.5、SK 海力士 IPO、长鑫科技 |

## 🔐 License

MIT

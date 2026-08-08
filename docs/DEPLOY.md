# 发布清单（GitHub + Vercel）

本环境目前**没有**配置 `origin` / `GH_TOKEN` / `VERCEL_TOKEN`，Agent 无法代你推代码或生产部署。按下面做完即可上线。

## A. GitHub 仓库（一次性）

在你本机或 Cursor 里（有 GitHub 登录的环境）：

```bash
# 在仓库根目录
gh auth login
gh repo create outdoor-copilot --private --source=. --remote=origin
git push -u origin cursor/xhs-share-deploy-6c94

# 可选：打主分支
git checkout -b main
git push -u origin main
```

或把已有空仓库地址发我：

```bash
git remote add origin git@github.com:<you>/outdoor-copilot.git
git push -u origin cursor/xhs-share-deploy-6c94
```

若希望 **Cloud Agent 代推**：在对话里提供有 `repo` 权限的 `GH_TOKEN`（或 PAT），并确认仓库名。

## B. Vercel 生产部署

1. 打开 [vercel.com/account/tokens](https://vercel.com/account/tokens) 创建 Token  
2. 在本机：

```bash
export VERCEL_TOKEN=...
./scripts/deploy-vercel.sh
```

或把 `VERCEL_TOKEN` 发给 Agent 代跑（勿发到公开渠道）。

3. 在 Vercel 项目 → **Settings → Environment Variables** 设置：

| 变量 | 值 |
|------|-----|
| `OPENAI_API_KEY` | 你的 DeepSeek/OpenAI Key（**换新后的**，勿用聊过天的旧 Key） |
| `OPENAI_BASE_URL` | `https://api.deepseek.com`（若用 DeepSeek） |
| `OPENAI_MODEL` | `deepseek-chat` |
| `NEXT_PUBLIC_SITE_URL` | `https://你的正式域名` |

4. Redeploy 一次。  
5. 打开 `/api/status` 确认 `weather.reachable` 与 `llm.configured`。

## C. 上线前手测（5 分钟）

- [ ] 首页品牌与 CTA 正常  
- [ ] 示例路线 → 基础报告 → 个人报告  
- [ ] 报告显示「天气来自 Open-Meteo」  
- [ ] 解释来源为「AI 润色」（若已配 Key）  
- [ ] **生成小红书分享图** → 预览 3:4 图 → 保存/系统分享 → 复制文案  
- [ ] iPhone Safari：分享图可存相册或进分享面板  
- [ ] `/history` 重算可用  
- [ ] 微信/小红书外链预览 OG 图（部署后）

## D. 小红书发布建议

1. App 内发图笔记，选刚保存的海报（竖图 3:4）  
2. 粘贴「复制文案」内容（含话题标签）  
3. 正文可再补一句真实体感；避免只贴纯文字摘要

# Outdoor Copilot · 个人户外智能

**V0.1 — Personal Route Intelligence**

> Know the trail. Know yourself. Go smarter.  
> 先看清这条路对你有多难。

手机优先的 Web 产品：上传 GPX（或点真实示例）→ 得到**对你**的个人难度、时长区间、挑战路段与出发建议。  
不做社交、不做导航、不做全球路线库；核心是 **人 × 轨迹 × 环境** 的决策辅助。

**线上：** https://outdoor-copilot.vercel.app

**战略文档：** [docs/](docs/)（愿景 / 12 周路线图 / 运营 / 数据 / AI / 决策 / 指标）· 工程规则见 [AGENTS.md](AGENTS.md)

---

## 用户怎么交互

```text
首页
  → 分析我的路线
       → 上传 GPX  或  选示例（海坨山 / 大黑峰 / 阳台山—妙峰山）
            → 基础报告（路线基础负荷）
                 → 完善档案 / 跳过默认
                      → 个人报告（Personal Difficulty）
                           → 改出发时刻 what-if
                           → 导出/分享摘要
                           → 回填实际用时
  → 本机历史（重算 / 清除数据）
  → 如何使用
```

### 关键页面

| 页面 | 做什么 |
|------|--------|
| `/` | 品牌落地：一句话价值 + 进入分析 |
| `/about` | 三步说明 + 数据/免边界 |
| `/analyze` | 选线 → 基础负荷 → 档案 → 个人报告 |
| `/history` | 本机历史快照、用当前档案重算、导出事件 |

### 报告里你会看到

1. **基础负荷 vs 对你的难度**（并排对照）  
2. **分项**：耐力 / 攀爬 / 天气 / 风险 + 置信度  
3. **Why**：可解释加减分（不是黑盒一句「很难」）  
4. **时长区间**（故意不用假装精确的单点时间）  
5. **挑战路段**（如连续爬升公里段）  
6. **建议**：出发时刻、完成窗口、饮水量、主风险  
7. **分享**：系统分享面板 / 复制摘要（适配 iPhone）

数据默认只存在浏览器本机，**无需注册**。

---

## 系统怎么工作

```text
GPX / 示例
   ↓
parseGpx → 点列
   ↓
analyzeRoute（唯一计算入口）
   ├─ 距离 / 爬升 / 自适应分段 / 海拔剖面
   ├─ Base Difficulty（路线本身）
   ├─ 天气（Open-Meteo，失败则中性假设）
   ├─ 生理负荷参考层（学术公式，可缺省）
   ├─ Personal Difficulty（档案调整）
   ├─ 时长区间 + 挑战 + 出发建议
   └─ 模板解释（可选 LLM 润色，不改数字）
   ↓
报告 UI + 本机存储
```

硬规则：**分数与公里段只来自确定性引擎**；LLM 只解释，不创造关键数据。

技术栈：Next.js · TypeScript · 浏览器本地存储 · Vitest（`analyzeRoute` seam）

---

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
npm test
npm run build
```

环境变量见 `.env.example`（可选 `OPENAI_*`、`NEXT_PUBLIC_SITE_URL`）。  
**天气与 LLM 配置步骤：** [docs/SETUP-APIS.md](docs/SETUP-APIS.md)（天气默认真接 Open-Meteo；LLM 需你自备 Key）。  
运行时探测：`GET /api/status`。

---

## 版本控制

| 项 | 约定 |
|----|------|
| 当前发布线 | `cursor/real-sample-routes-6c94`（含真实示例与上线准备） |
| 版本标签 | `v0.1.0` — 首个可演示的 Personal Route Intelligence |
| 提交风格 | Conventional Commits（`feat` / `fix` / `chore` / `docs`） |
| 分支 | `cursor/<topic>-6c94` 做功能；稳定后合并/推送到 `main` |

### 首次推送到 GitHub

本仓库当前**没有配置 `origin`**。在有权限的机器上：

```bash
# 1) 创建空仓库后（GitHub 网页或 gh）
gh repo create outdoor-copilot --private --source=. --remote=origin

# 或手动：
git remote add origin git@github.com:<you>/outdoor-copilot.git

# 2) 推送发布线与标签
git push -u origin cursor/real-sample-routes-6c94
git push origin v0.1.0

# 3)（可选）设为默认分支 / 合并到 main
git checkout -b main
git push -u origin main
```

需要 Agent 代推时：提供 `GH_TOKEN`（repo 权限）或已存在的 `origin` URL。

### 部署到 Vercel

完整清单见 [docs/DEPLOY.md](docs/DEPLOY.md)（含 GitHub、环境变量、小红书手测）。

```bash
export VERCEL_TOKEN=...   # https://vercel.com/account/tokens
./scripts/deploy-vercel.sh
# 或：npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

部署后把 `NEXT_PUBLIC_SITE_URL` 设为正式域名；LLM 变量见 [docs/SETUP-APIS.md](docs/SETUP-APIS.md)。

### 小红书分享

个人报告 → **生成小红书分享图**（3:4 PNG）→ 保存/系统分享 → **复制文案** 作为笔记配文。

---

## Demo 示例路线

| 示例 | 区域 | 意图 |
|------|------|------|
| 海坨山 | 北京·延庆 | 高峰、攀爬突出 |
| 大黑峰 | 张家口 | 中长爬升结构清晰 |
| 阳台山—妙峰山环线 | 北京 | 更长距离 / 更高累计负荷 |

同一座山常有多种走法；示例只用于体验产品，出行请以你确认的 GPX 为准。

---

## 文档

- 产品 Spec：`docs/superpowers/specs/2026-08-08-outdoor-copilot-v01-design.md`
- 工单（本地）：`.scratch/outdoor-copilot-v01/issues/`（若未忽略）

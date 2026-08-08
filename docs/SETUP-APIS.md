# 外部接口配置指南

Outdoor Copilot V0.1 只有两个可配置的外部能力：**天气（默认已真接）** 与 **LLM 解释润色（需你提供 Key）**。

检查当前状态：启动应用后访问 `GET /api/status`。

---

## 1. 天气（Open-Meteo）— 无需申请

| 项 | 说明 |
|----|------|
| 接口 | `GET /api/weather` → [Open-Meteo Forecast](https://open-meteo.com/en/docs) |
| Key | **不需要** |
| 失败行为 | 返回中性假设天气（`source: "fallback"`），报告仍可用 |

本地 / 部署后只要服务器能访问 `api.open-meteo.com` 即为真天气。  
商业大规模用量见 [Open-Meteo 定价](https://open-meteo.com/en/pricing)；个人 Demo 一般够用。

---

## 2. LLM 解释润色 — 需要你配置 Key

引擎分数**从不**依赖 LLM。配置后，个人报告的中文解释会从「模板」变为「AI 润色」。

### 本地开发

1. 在仓库根目录复制环境变量模板：

```bash
cp .env.example .env.local
```

2. 编辑 `.env.local`，填入至少一项：

```bash
OPENAI_API_KEY=sk-...          # 必填才会走真 LLM
OPENAI_BASE_URL=https://api.openai.com/v1   # 可选；兼容网关可改
OPENAI_MODEL=gpt-4o-mini       # 可选
```

3. **重启** `npm run dev`（Next 只在启动时读这些变量）。

4. 打开 `/analyze` → 完成个人报告 → 看「解释来源」是否为「AI 润色」。  
   或访问 `/api/status`，确认 `llm.configured: true`。

### 可选：国内 / 兼容网关

任何 **OpenAI Chat Completions 兼容** 服务均可，例如：

| 服务 | 申请入口 | `OPENAI_BASE_URL` 示例 |
|------|----------|------------------------|
| [OpenAI](https://platform.openai.com/api-keys) | 创建 API key | `https://api.openai.com/v1` |
| [DeepSeek](https://platform.deepseek.com/api_keys) | 创建 API key | `https://api.deepseek.com` |
| 其他兼容代理 | 按厂商文档 | 其 `/v1` 根路径 |

`OPENAI_MODEL` 改成该平台支持的模型名（如 `deepseek-chat`）。

### Vercel 生产环境

1. 打开 Vercel 项目 → **Settings → Environment Variables**
2. 添加：
   - `OPENAI_API_KEY`（Production / Preview 按需）
   - 可选 `OPENAI_BASE_URL`、`OPENAI_MODEL`
   - 推荐 `NEXT_PUBLIC_SITE_URL=https://你的域名`
3. **Redeploy** 一次使变量生效。

无 Key 时解释自动降级为模板，产品其余功能不受影响。

---

## 3. 站点 URL（分享 / OG）

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

未设置时布局会回退到占位域名；部署正式环境后请改成真实地址。

---

## 4. 有意保留的「非云端」实现（不是漏接）

| 能力 | 现状 | 原因 |
|------|------|------|
| 历史 / 档案 / 事件 | 浏览器 `localStorage` | V0.1 无账号；Spec 允许本地持久化 |
| 分析计算 | 浏览器内 `analyzeRoute` | 核心引擎，不是临时 Mock |
| 示例路线 | `public/samples/*.gpx` | 产品内置 Demo，不是假 API |

这些**不需要**你申请第三方配置。

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "如何使用 · Outdoor Copilot",
  description: "上传 GPX / KML 或选用示例，得到对你的个人路线难度与出发建议。",
};

export default function AboutPage() {
  return (
    <main className="app-atmosphere min-h-dvh text-[var(--ink)]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 cursor-pointer items-center text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        <div className="reveal-up">
          <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
            使用说明
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[-0.02em]">
            四步看清一条路对你有多难
          </h1>
        </div>

        <ol className="mt-8 space-y-5 text-base leading-relaxed text-[var(--ink-soft)]">
          {[
            {
              title: "1. 选线",
              body: "上传你自己的 GPX / KML，或先点内置真实示例（海坨山 / 大黑峰 / 阳台山—妙峰山）。自动按文件内容识别格式。",
            },
            {
              title: "2. 看基础负荷",
              body: "系统先解析距离、爬升、坡度结构，给出路线基础难度——这还不是「对你」的分数。",
            },
            {
              title: "3. 完善或跳过档案",
              body: "填写经验、舒适距离/爬升与风险偏好（生理数据可选），得到个人难度、时长区间、挑战路段与出发建议。",
            },
            {
              title: "4. 分享到小红书",
              body: "在个人报告点「生成小红书分享图」，保存 3:4 海报，再「复制文案」贴到笔记配文——不要只发一段纯文字摘要。",
            },
          ].map((step) => (
            <li
              key={step.title}
              className="border-b border-[var(--border-soft)] pb-5 last:border-0"
            >
              <p className="font-[family-name:var(--font-serif-sc)] text-lg text-[var(--ink)]">
                {step.title}
              </p>
              <p className="mt-1.5">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 space-y-3 border-t border-[var(--border-soft)] pt-6 text-sm leading-relaxed text-[var(--rock)]">
          <p>数据默认只保存在你的浏览器本机，无需注册。</p>
          <p>
            这是辅助判断工具，不是导航、天气预报权威源，也不能替代经验、向导或现场决策。天气数据来自
            Open-Meteo；解释文案可选用兼容 LLM 润色。
          </p>
          <p>
            示例轨迹用于体验产品；同一座山常有多种走法，正式出行请以你确认要走的
            GPX / KML 为准。
          </p>
        </div>

        <Link
          href="/analyze"
          className="btn-accent mt-10 inline-flex min-h-12 px-7 py-3.5 text-sm"
        >
          开始分析
        </Link>
      </div>
    </main>
  );
}

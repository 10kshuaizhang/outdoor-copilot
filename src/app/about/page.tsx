import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "如何使用 · Outdoor Copilot",
  description: "上传 GPX 或选用示例，得到对你的个人路线难度与出发建议。",
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
          使用说明
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[-0.02em]">
          三步看清一条路对你有多难
        </h1>

        <ol className="mt-8 space-y-6 text-base leading-relaxed text-[var(--ink-soft)]">
          <li>
            <p className="font-semibold text-[var(--ink)]">1. 选线</p>
            <p className="mt-1">
              上传你自己的 GPX，或先点内置真实示例（海坨山 / 大黑峰 /
              阳台山—妙峰山）。
            </p>
          </li>
          <li>
            <p className="font-semibold text-[var(--ink)]">2. 看基础负荷</p>
            <p className="mt-1">
              系统先解析距离、爬升、坡度结构，给出路线基础难度——这还不是「对你」的分数。
            </p>
          </li>
          <li>
            <p className="font-semibold text-[var(--ink)]">3. 完善或跳过档案</p>
            <p className="mt-1">
              填写经验、舒适距离/爬升与风险偏好（生理数据可选），得到 Personal
              Difficulty、时长区间、挑战路段与出发建议。
            </p>
          </li>
        </ol>

        <div className="mt-10 space-y-3 border-t border-black/10 pt-6 text-sm leading-relaxed text-[var(--rock)]">
          <p>数据默认只保存在你的浏览器本机，无需注册。</p>
          <p>
            这是辅助判断工具，不是导航、天气预报权威源，也不能替代经验、向导或现场决策。
          </p>
          <p>
            示例轨迹用于体验产品；同一座山常有多种走法，正式出行请以你确认要走的 GPX
            为准。
          </p>
        </div>

        <Link
          href="/analyze"
          className="mt-10 inline-flex bg-[var(--pine-deep)] px-6 py-3.5 text-sm font-semibold text-[var(--cream)]"
        >
          开始分析
        </Link>
      </div>
    </main>
  );
}

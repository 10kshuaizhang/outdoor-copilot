import Image from "next/image";
import { LandingTracker } from "@/components/LandingTracker";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--bg-deep)] text-[var(--cream)]">
      <LandingTracker />
      <div className="absolute inset-0">
        <Image
          src="/hero-trail.jpg"
          alt="晨光中的山径"
          fill
          priority
          quality={78}
          className="hero-media object-cover motion-reduce:animate-none"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(12,34,38,0.92) 0%, rgba(12,34,38,0.58) 46%, rgba(12,34,38,0.22) 100%), linear-gradient(to top, rgba(12,34,38,0.82) 0%, transparent 48%)",
          }}
        />
        <div
          className="hero-mist pointer-events-none absolute inset-0 motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 78% 28%, rgba(232,213,208,0.28), transparent 70%), radial-gradient(ellipse 40% 35% at 18% 72%, rgba(74,138,136,0.22), transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pb-10 pt-8 sm:px-8">
        <section className="flex flex-1 flex-col justify-end gap-7 pb-8 pt-16 sm:max-w-xl sm:justify-center sm:pb-16">
          <div className="hero-copy motion-reduce:animate-none">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(3rem,11vw,5.75rem)] leading-[0.92] tracking-[-0.03em] text-white">
              Outdoor
              <br />
              Copilot
            </h1>
            <p className="mt-4 font-[family-name:var(--font-serif-sc)] text-2xl tracking-[0.1em] text-[var(--dawn)] sm:text-3xl">
              个人户外智能
            </p>
          </div>

          <div className="hero-copy-delay motion-reduce:animate-none">
            <p className="max-w-md font-[family-name:var(--font-serif-sc)] text-lg leading-relaxed text-[var(--mist)]/95 sm:text-xl">
              先看清这条路对你有多难。
            </p>
          </div>

          <div className="hero-cta flex flex-col gap-4 motion-reduce:animate-none sm:flex-row sm:items-center">
            {/* Hard navigation: more reliable on WeChat / in-app browsers than client Link. */}
            <a
              href="/analyze"
              className="btn-accent cta-pulse inline-flex min-h-12 items-center justify-center px-8 py-3.5 text-center text-base tracking-wide motion-reduce:animate-none"
            >
              分析我的路线
            </a>
            <div className="flex gap-5 text-sm text-[var(--mist)]">
              <a
                href="/about"
                className="cursor-pointer underline-offset-4 transition hover:text-white hover:underline"
              >
                如何使用
              </a>
              <a
                href="/history"
                className="cursor-pointer underline-offset-4 transition hover:text-white hover:underline"
              >
                已保存预测
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--bg-deep)] text-[var(--cream)]">
      <div className="absolute inset-0">
        <Image
          src="/hero-trail.jpg"
          alt="晨光中的山径"
          fill
          priority
          quality={72}
          className="hero-media object-cover motion-reduce:animate-none"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(26,36,28,0.88) 0%, rgba(26,36,28,0.62) 42%, rgba(26,36,28,0.28) 100%), linear-gradient(to top, rgba(26,36,28,0.75) 0%, transparent 45%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pb-10 pt-8 sm:px-8">
        <section className="flex flex-1 flex-col justify-end gap-6 pb-8 pt-16 sm:max-w-xl sm:justify-center sm:pb-16">
          <div className="hero-copy motion-reduce:animate-none">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,10vw,5.5rem)] leading-[0.95] tracking-[-0.03em] text-white">
              Outdoor
              <br />
              Copilot
            </h1>
            <p className="mt-4 font-[family-name:var(--font-serif-sc)] text-2xl tracking-[0.08em] text-[var(--dawn)] sm:text-3xl">
              个人户外智能
            </p>
          </div>

          <div className="hero-copy-delay space-y-3 motion-reduce:animate-none">
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--mist)] sm:text-xl">
              Know the trail. Know yourself. Go smarter.
            </p>
            <p className="max-w-md font-[family-name:var(--font-serif-sc)] text-base leading-relaxed text-[var(--mist)]/90">
              先看清这条路对你有多难。
            </p>
          </div>

          <div className="hero-cta motion-reduce:animate-none">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center bg-[var(--cta)] px-7 py-3.5 text-center text-base font-semibold tracking-wide text-[var(--cta-ink)] transition hover:brightness-105"
            >
              分析我的路线
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

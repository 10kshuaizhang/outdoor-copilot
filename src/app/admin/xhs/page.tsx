"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DEFAULT_EDITORIAL_TAGLINE,
  EDITORIAL_PRESETS,
  editorialFilename,
  renderEditorialCardPng,
  type EditorialCardInput,
} from "@/lib/share/renderEditorialCard";

function itemsToText(items: string[]): string {
  return items.join("\n");
}

function textToItems(text: string): string[] {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span className="mb-1.5 block">
      <span className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.08em] text-[var(--pine)]">
        {children}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--rock)]">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

export default function AdminXhsStudioPage() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState("rain-gear-4");

  const rain = EDITORIAL_PRESETS[0]!.input;
  const [title, setTitle] = useState(rain.title);
  const [eyebrow, setEyebrow] = useState(rain.eyebrow ?? "");
  const [lead, setLead] = useState(rain.lead ?? "");
  const [heroNumber, setHeroNumber] = useState(rain.heroNumber ?? "");
  const [heroUnit, setHeroUnit] = useState(rain.heroUnit ?? "");
  const [heroLabel, setHeroLabel] = useState(rain.heroLabel ?? "");
  const [itemsText, setItemsText] = useState(itemsToText(rain.items ?? []));
  const [sectionTitle, setSectionTitle] = useState(rain.sectionTitle ?? "");
  const [sectionBody, setSectionBody] = useState(rain.sectionBody ?? "");
  const [footerNote, setFooterNote] = useState(rain.footerNote ?? "");
  const [tagline, setTagline] = useState(
    rain.tagline ?? DEFAULT_EDITORIAL_TAGLINE,
  );

  const draft: EditorialCardInput = useMemo(
    () => ({
      title,
      eyebrow,
      lead,
      heroNumber,
      heroUnit,
      heroLabel,
      items: textToItems(itemsText),
      sectionTitle,
      sectionBody,
      footerNote,
      tagline,
    }),
    [
      title,
      eyebrow,
      lead,
      heroNumber,
      heroUnit,
      heroLabel,
      itemsText,
      sectionTitle,
      sectionBody,
      footerNote,
      tagline,
    ],
  );

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as {
      configured?: boolean;
      authed?: boolean;
    };
    setConfigured(Boolean(data.configured));
    setAuthed(Boolean(data.authed));
    return Boolean(data.authed);
  }, []);

  useEffect(() => {
    void refreshSession().finally(() => setBootstrapping(false));
  }, [refreshSession]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const applyPreset = (id: string) => {
    const preset = EDITORIAL_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const i = preset.input;
    setActivePreset(id);
    setTitle(i.title);
    setEyebrow(i.eyebrow ?? "");
    setLead(i.lead ?? "");
    setHeroNumber(i.heroNumber ?? "");
    setHeroUnit(i.heroUnit ?? "");
    setHeroLabel(i.heroLabel ?? "");
    setItemsText(itemsToText(i.items ?? []));
    setSectionTitle(i.sectionTitle ?? "");
    setSectionBody(i.sectionBody ?? "");
    setFooterNote(i.footerNote ?? "");
    setTagline(i.tagline ?? DEFAULT_EDITORIAL_TAGLINE);
    setStatus(`已载入预设：${preset.name}`);
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("密码错误或登录失败");
      return;
    }
    setPassword("");
    setAuthed(true);
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const blob = await renderEditorialCardPng(draft);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setStatus("已生成预览，可下载 PNG。");
      return blob;
    } catch {
      setError("生成失败。请确认浏览器支持 Canvas，并刷新后重试。");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    const blob = previewUrl
      ? await fetch(previewUrl).then((r) => r.blob())
      : await generate();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = editorialFilename(title);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("已开始下载。");
  };

  if (bootstrapping) {
    return (
      <main className="app-atmosphere min-h-dvh px-5 py-10 text-[var(--ink)]">
        <p className="text-sm text-[var(--rock)]">加载…</p>
      </main>
    );
  }

  return (
    <main className="app-atmosphere min-h-dvh text-[var(--ink)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/admin"
            className="text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
          >
            ← 管理后台
          </Link>
          {authed ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="text-sm text-[var(--rock)] underline-offset-4 hover:underline"
            >
              退出
            </button>
          ) : null}
        </div>

        <header className="mb-8 max-w-2xl">
          <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
            内部工具
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em] lg:text-4xl">
            小红书封面制图
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
            非路线分析帖用。版式与路线分享图一致（1080×1440 Moss & Dawn），不挂公开导航。
          </p>
        </header>

        {!configured ? (
          <p className="mb-6 max-w-xl border border-amber-800/30 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            未配置 <code className="font-mono">ADMIN_PASSWORD</code>
            。与示例管理共用同一套登录。
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="mb-4 text-sm text-[var(--pine)]" role="status">
            {status}
          </p>
        ) : null}

        {configured && !authed ? (
          <form
            onSubmit={(e) => void onLogin(e)}
            className="panel mx-auto max-w-md space-y-4 px-5 py-6"
          >
            <label className="block text-sm">
              <FieldLabel>管理密码</FieldLabel>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full py-3">
              登录后制图
            </button>
          </form>
        ) : null}

        {authed ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="space-y-5">
              <section className="panel px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  预设模板
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EDITORIAL_PRESETS.map((p) => {
                    const selected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                          selected
                            ? "border-[var(--pine)] bg-[var(--pine)]/10 text-[var(--pine-deep)]"
                            : "border-[var(--border-soft)] bg-white/60 text-[var(--ink)] hover:border-[var(--pine)]/40"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="panel space-y-4 px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  标题区
                </p>
                <label className="block text-sm">
                  <FieldLabel hint="Enter 换行，对应海报顶栏多行标题">
                    标题
                  </FieldLabel>
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    rows={3}
                    className="field-input min-h-24"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel hint="奶油面板内绿色栏目标题">
                    栏目标题
                  </FieldLabel>
                  <input
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    className="field-input"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel>导语</FieldLabel>
                  <textarea
                    value={lead}
                    onChange={(e) => setLead(e.target.value)}
                    rows={3}
                    className="field-input min-h-24"
                  />
                </label>
              </section>

              <section className="panel space-y-4 px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  数字英雄
                </p>
                <p className="text-xs text-[var(--rock)]">
                  留空则隐藏大数字区块（适合纯清单帖）。
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block text-sm">
                    <FieldLabel>大数字</FieldLabel>
                    <input
                      value={heroNumber}
                      onChange={(e) => setHeroNumber(e.target.value)}
                      className="field-input"
                      placeholder="4"
                    />
                  </label>
                  <label className="block text-sm">
                    <FieldLabel>单位</FieldLabel>
                    <input
                      value={heroUnit}
                      onChange={(e) => setHeroUnit(e.target.value)}
                      className="field-input"
                      placeholder="/ 样"
                    />
                  </label>
                  <label className="block text-sm">
                    <FieldLabel>旁标签</FieldLabel>
                    <input
                      value={heroLabel}
                      onChange={(e) => setHeroLabel(e.target.value)}
                      className="field-input"
                      placeholder="雨天加装"
                    />
                  </label>
                </div>
              </section>

              <section className="panel space-y-4 px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  清单
                </p>
                <label className="block text-sm">
                  <FieldLabel hint="每行一条，最多 6 条">
                    编号列表
                  </FieldLabel>
                  <textarea
                    value={itemsText}
                    onChange={(e) => setItemsText(e.target.value)}
                    rows={5}
                    className="field-input min-h-32 font-mono text-sm"
                  />
                </label>
              </section>

              <section className="panel space-y-4 px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  补充小节
                </p>
                <label className="block text-sm">
                  <FieldLabel>小节标题</FieldLabel>
                  <input
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="field-input"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel>小节正文</FieldLabel>
                  <textarea
                    value={sectionBody}
                    onChange={(e) => setSectionBody(e.target.value)}
                    rows={2}
                    className="field-input min-h-20"
                  />
                </label>
              </section>

              <section className="panel space-y-4 px-4 py-5">
                <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
                  页脚
                </p>
                <label className="block text-sm">
                  <FieldLabel hint="对应路线分享图「主风险」位置">
                    底部中文金句
                  </FieldLabel>
                  <textarea
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    rows={2}
                    className="field-input min-h-20"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel hint="固定 baseline，与路线分享图 slogan 对齐">
                    英文 slogan
                  </FieldLabel>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="field-input"
                  />
                </label>
              </section>

              <div className="grid grid-cols-2 gap-3 lg:hidden">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void generate()}
                  className="btn-accent col-span-2 min-h-12 py-3 disabled:opacity-60"
                >
                  {busy ? "生成中…" : "生成预览"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDownload()}
                  className="btn-ghost min-h-11 py-2.5 disabled:opacity-60"
                >
                  下载 PNG
                </button>
              </div>

              {previewUrl ? (
                <div className="panel p-4 lg:hidden">
                  <p className="mb-3 text-xs tracking-[0.12em] text-[var(--rock)]">
                    预览
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="小红书封面预览"
                    className="mx-auto w-full max-w-xs shadow-[var(--shadow-soft)]"
                  />
                </div>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-8">
              <div className="panel overflow-hidden">
                <div className="border-b border-[var(--border-soft)] bg-[var(--bg-moss)] px-4 py-3">
                  <p className="font-[family-name:var(--font-serif-sc)] text-xs tracking-[0.14em] text-[var(--dawn)]">
                    1080 × 1440 · 3:4
                  </p>
                  <p className="mt-1 text-sm text-[var(--mist)]/90">
                    Moss & Dawn · 与路线分享图同 chrome
                  </p>
                </div>

                <div className="flex min-h-[420px] items-center justify-center bg-[var(--cream)] p-5">
                  {previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewUrl}
                      alt="小红书封面预览"
                      className="w-full max-w-[280px] shadow-[var(--shadow-lift)]"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-[320px] w-[240px] rounded-sm border border-dashed border-[var(--border-soft)] bg-white/50" />
                      <p className="text-sm text-[var(--rock)]">
                        填写内容后点「生成预览」
                      </p>
                      <p className="mt-1 text-xs text-[var(--rock)]">
                        页脚位置与路线分享图对齐
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-soft)] p-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void generate()}
                    className="btn-accent col-span-2 min-h-11 py-2.5 disabled:opacity-60"
                  >
                    {busy ? "生成中…" : "生成预览"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDownload()}
                    className="btn-ghost col-span-2 min-h-11 py-2.5 disabled:opacity-60"
                  >
                    下载 PNG
                  </button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}

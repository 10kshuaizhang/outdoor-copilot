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

export default function AdminXhsStudioPage() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      <div className="mx-auto w-full max-w-lg px-5 py-8">
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

        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
          内部工具
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          小红书封面制图
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          非路线分析帖用。版式与路线分享图一致（1080×1440），不挂公开导航。
        </p>

        {!configured ? (
          <p className="mt-8 border border-amber-800/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            未配置 <code className="font-mono">ADMIN_PASSWORD</code>
            。与示例管理共用同一套登录。
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="mt-4 text-sm text-[var(--pine)]" role="status">
            {status}
          </p>
        ) : null}

        {configured && !authed ? (
          <form onSubmit={(e) => void onLogin(e)} className="mt-8 space-y-4">
            <label className="block text-sm">
              管理密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
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
          <div className="mt-8 space-y-5">
            <label className="block text-sm">
              预设
              <select
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                defaultValue="rain-gear-4"
                onChange={(e) => applyPreset(e.target.value)}
              >
                {EDITORIAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              标题（换行分段）
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              栏目标题
              <input
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              导语
              <textarea
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm">
                大数字
                <input
                  value={heroNumber}
                  onChange={(e) => setHeroNumber(e.target.value)}
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  placeholder="可空"
                />
              </label>
              <label className="block text-sm">
                单位
                <input
                  value={heroUnit}
                  onChange={(e) => setHeroUnit(e.target.value)}
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  placeholder="/ 样"
                />
              </label>
              <label className="block text-sm">
                数字旁标签
                <input
                  value={heroLabel}
                  onChange={(e) => setHeroLabel(e.target.value)}
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm">
              清单（每行一条，最多 6）
              <textarea
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                rows={5}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              小节标题
              <input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              小节正文
              <textarea
                value={sectionBody}
                onChange={(e) => setSectionBody(e.target.value)}
                rows={2}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              底部中文金句
              <textarea
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                rows={2}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              英文 slogan
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
              />
            </label>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void generate()}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {busy ? "生成中…" : "生成预览"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDownload()}
                className="btn-ghost w-full py-3 disabled:opacity-60"
              >
                下载 PNG
              </button>
            </div>

            {previewUrl ? (
              <div className="pt-4">
                <p className="mb-2 text-xs tracking-[0.12em] text-[var(--rock)]">
                  预览
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="小红书封面预览"
                  className="w-full rounded-lg border border-black/10"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

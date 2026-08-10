"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AdminSample = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  stats?: string;
  file: string;
  format?: string;
  updatedAt?: string;
};

type StorageInfo = {
  dataDir: string;
  writable: boolean;
  ephemeral: boolean;
  count: number;
};

type FormState = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  stats: string;
  file: File | null;
};

const emptyForm = (): FormState => ({
  id: "",
  name: "",
  region: "",
  blurb: "",
  stats: "",
  file: null,
});

export default function AdminPage() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [password, setPassword] = useState("");
  const [samples, setSamples] = useState<AdminSample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as {
      configured?: boolean;
      authed?: boolean;
      storage?: StorageInfo;
    };
    setConfigured(Boolean(data.configured));
    setAuthed(Boolean(data.authed));
    setStorage(data.storage ?? null);
    return Boolean(data.authed);
  }, []);

  const loadSamples = useCallback(async () => {
    const res = await fetch("/api/admin/samples");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = (await res.json()) as {
      samples?: AdminSample[];
      storage?: StorageInfo;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "加载失败");
      return;
    }
    setSamples(data.samples ?? []);
    setStorage(data.storage ?? null);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const ok = await refreshSession();
        if (ok) await loadSamples();
      } catch {
        setError("无法连接管理接口");
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [loadSamples, refreshSession]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }
      setPassword("");
      setAuthed(true);
      await loadSamples();
    } catch {
      setError("登录请求失败");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSamples([]);
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (s: AdminSample) => {
    setEditingId(s.id);
    setForm({
      id: s.id,
      name: s.name,
      region: s.region,
      blurb: s.blurb,
      stats: s.stats ?? "",
      file: null,
    });
    setMessage(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        const body = new FormData();
        body.set("name", form.name);
        body.set("region", form.region);
        body.set("blurb", form.blurb);
        body.set("stats", form.stats);
        if (form.file) body.set("file", form.file);
        const res = await fetch(
          `/api/admin/samples/${encodeURIComponent(editingId)}`,
          { method: "PATCH", body },
        );
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "更新失败");
          return;
        }
        setMessage("已更新示例");
        cancelEdit();
      } else {
        if (!form.file) {
          setError("新建示例需要上传 GPX / KML");
          return;
        }
        const body = new FormData();
        if (form.id.trim()) body.set("id", form.id.trim());
        body.set("name", form.name);
        body.set("region", form.region);
        body.set("blurb", form.blurb);
        body.set("stats", form.stats);
        body.set("file", form.file);
        const res = await fetch("/api/admin/samples", {
          method: "POST",
          body,
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "创建失败");
          return;
        }
        setMessage("已新增示例");
        setForm(emptyForm());
      }
      await loadSamples();
    } catch {
      setError("保存失败");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定删除示例「${name}」？此操作不可撤销。`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/samples/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "删除失败");
        return;
      }
      if (editingId === id) cancelEdit();
      setMessage(`已删除 ${name}`);
      await loadSamples();
    } catch {
      setError("删除失败");
    } finally {
      setBusy(false);
    }
  };

  if (bootstrapping) {
    return (
      <main className="min-h-dvh bg-[var(--cream)] px-5 py-10 text-[var(--ink)]">
        <p className="text-sm text-[var(--rock)]">加载管理后台…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
          >
            ← Outdoor Copilot
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
          管理后台
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          示例路线
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          增删改查分析页展示的示例轨迹。上传 GPX / KML，简介会显示在选线列表。
        </p>

        {!configured ? (
          <p className="mt-8 border border-amber-800/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            未配置 <code className="font-mono">ADMIN_PASSWORD</code>
            。在服务器环境变量中设置后重启即可登录。
          </p>
        ) : null}

        {storage ? (
          <p className="mt-4 text-xs leading-relaxed text-[var(--rock)]">
            存储：{storage.dataDir}
            {storage.ephemeral ? "（当前环境为临时目录，重启可能丢失）" : ""}
            {!storage.writable ? " · 只读，无法写入" : ` · ${storage.count} 条`}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 text-sm text-[var(--pine)]" role="status">
            {message}
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
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[var(--pine-deep)] px-4 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-60"
            >
              {busy ? "登录中…" : "登录"}
            </button>
          </form>
        ) : null}

        {authed ? (
          <>
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="mt-8 space-y-3 border border-black/10 bg-white/70 px-4 py-5"
            >
              <p className="text-sm font-semibold text-[var(--pine-deep)]">
                {editingId ? `编辑：${editingId}` : "新增示例"}
              </p>
              {!editingId ? (
                <label className="block text-sm">
                  ID（可选，英文/数字）
                  <input
                    value={form.id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, id: e.target.value }))
                    }
                    className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                    placeholder="自动生成"
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                名称
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                地区
                <input
                  value={form.region}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, region: e.target.value }))
                  }
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                简介
                <textarea
                  value={form.blurb}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, blurb: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm">
                统计文案（可选，空则按轨迹自动估算）
                <input
                  value={form.stats}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stats: e.target.value }))
                  }
                  className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
                  placeholder="约 8.8 km · +740 m"
                />
              </label>
              <label className="block text-sm">
                轨迹文件{editingId ? "（可选，不传则保留原文件）" : ""}
                <input
                  type="file"
                  accept=".gpx,.kml,.xml,application/gpx+xml,application/vnd.google-earth.kml+xml,*/*"
                  className="mt-1 block w-full text-sm"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
                  required={!editingId}
                />
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 bg-[var(--pine-deep)] px-4 py-2.5 text-sm font-semibold text-[var(--cream)] disabled:opacity-60"
                >
                  {busy ? "保存中…" : editingId ? "保存修改" : "创建示例"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2.5 text-sm text-[var(--rock)] underline-offset-4 hover:underline"
                  >
                    取消
                  </button>
                ) : null}
              </div>
            </form>

            <ul className="mt-10 space-y-4">
              {samples.map((s) => (
                <li
                  key={s.id}
                  className="border-b border-black/10 pb-4 last:border-0"
                >
                  <p className="text-xs tracking-[0.14em] text-[var(--pine)]">
                    {s.region}
                    {s.format ? ` · ${s.format.toUpperCase()}` : ""}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{s.blurb}</p>
                  {s.stats ? (
                    <p className="mt-1 text-xs tabular-nums text-[var(--rock)]">
                      {s.stats}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-xs text-[var(--rock)]">
                    {s.id}
                  </p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="font-semibold text-[var(--pine-deep)]"
                    >
                      编辑
                    </button>
                    <a
                      href={s.file}
                      className="text-[var(--rock)] underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      查看轨迹
                    </a>
                    <button
                      type="button"
                      onClick={() => void onDelete(s.id, s.name)}
                      className="text-red-800"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
              {samples.length === 0 ? (
                <li className="text-sm text-[var(--rock)]">暂无示例</li>
              ) : null}
            </ul>
          </>
        ) : null}
      </div>
    </main>
  );
}

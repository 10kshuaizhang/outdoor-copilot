"use client";

import { useState } from "react";
import type {
  ExperienceLevel,
  RiskPreference,
  UserProfile,
} from "@/lib/engine";

type Props = {
  initial?: Partial<UserProfile>;
  onSubmit: (profile: Partial<UserProfile>) => void;
  onSkip: () => void;
};

export function ProfileForm({ initial, onSubmit, onSkip }: Props) {
  const [experience, setExperience] = useState<ExperienceLevel>(
    initial?.experience ?? "intermediate",
  );
  const [comfortableDistanceKm, setDistance] = useState(
    initial?.comfortableDistanceKm ?? 10,
  );
  const [comfortableElevationM, setElevation] = useState(
    initial?.comfortableElevationM ?? 500,
  );
  const [riskPreference, setRisk] = useState<RiskPreference>(
    initial?.riskPreference ?? "balanced",
  );
  const [showMore, setShowMore] = useState(false);
  const [age, setAge] = useState(initial?.age?.toString() ?? "");
  const [heightCm, setHeight] = useState(initial?.heightCm?.toString() ?? "");
  const [weightKg, setWeight] = useState(initial?.weightKg?.toString() ?? "");
  const [restingHr, setRestingHr] = useState(
    initial?.restingHr?.toString() ?? "",
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          experience,
          comfortableDistanceKm: Number(comfortableDistanceKm),
          comfortableElevationM: Number(comfortableElevationM),
          riskPreference,
          age: age ? Number(age) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          restingHr: restingHr ? Number(restingHr) : undefined,
        });
      }}
    >
      <div>
        <label className="text-sm text-[var(--rock)]">徒步经验</label>
        <select
          className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
          value={experience}
          onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
        >
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">进阶</option>
          <option value="expert">资深</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">
          近期舒适距离（km）：{comfortableDistanceKm}
        </label>
        <input
          type="range"
          min={3}
          max={25}
          value={comfortableDistanceKm}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">
          近期舒适爬升（m）：{comfortableElevationM}
        </label>
        <input
          type="range"
          min={100}
          max={1500}
          step={50}
          value={comfortableElevationM}
          onChange={(e) => setElevation(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">风险偏好</label>
        <select
          className="mt-1 w-full border border-black/15 bg-white px-3 py-2"
          value={riskPreference}
          onChange={(e) => setRisk(e.target.value as RiskPreference)}
        >
          <option value="conservative">保守</option>
          <option value="balanced">均衡</option>
          <option value="aggressive">进取</option>
        </select>
      </div>

      <button
        type="button"
        className="text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? "收起生理数据" : "可选：补充生理数据"}
      </button>

      {showMore ? (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["年龄", age, setAge],
              ["身高 cm", heightCm, setHeight],
              ["体重 kg", weightKg, setWeight],
              ["静息心率", restingHr, setRestingHr],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="text-sm text-[var(--rock)]">
              {label}
              <input
                type="number"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[var(--ink)]"
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          className="bg-[var(--pine-deep)] px-5 py-3 text-sm font-semibold text-[var(--cream)]"
        >
          生成个人报告
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-[var(--rock)] underline-offset-4 hover:underline"
        >
          跳过，用默认档案
        </button>
      </div>
    </form>
  );
}

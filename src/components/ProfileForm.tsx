"use client";

import { useState } from "react";
import type { OutdoorProfile } from "@/domain/types";
import type {
  ExperienceLevel,
  RiskPreference,
  UserProfile,
} from "@/lib/engine";
import {
  COMFORT_BY_EXPERIENCE,
  COMFORT_DISTANCE_MAX_KM,
  COMFORT_ELEVATION_MAX_M,
} from "@/lib/engine";

export type ProfileFormValue = Partial<OutdoorProfile> &
  Partial<UserProfile> & { lastHikeAt?: string };

type Props = {
  initial?: ProfileFormValue;
  onSubmit: (profile: ProfileFormValue) => void;
  onSkip: () => void;
};

const BEGINNER = COMFORT_BY_EXPERIENCE.beginner;

export function ProfileForm({ initial, onSubmit, onSkip }: Props) {
  const [experience, setExperience] = useState<ExperienceLevel>(
    initial?.experience ?? "beginner",
  );
  const [typicalDistanceKm, setDistance] = useState(
    initial?.typicalDistanceKm ??
      initial?.comfortableDistanceKm ??
      BEGINNER.distanceKm,
  );
  const [typicalElevationM, setElevation] = useState(
    initial?.typicalElevationM ??
      initial?.comfortableElevationM ??
      BEGINNER.elevationM,
  );
  const [riskPreference, setRisk] = useState<RiskPreference>(
    initial?.riskPreference ?? "balanced",
  );
  const [lastHikeAt, setLastHikeAt] = useState(initial?.lastHikeAt ?? "");
  const [showMore, setShowMore] = useState(
    Boolean(initial?.age || initial?.heightCm || initial?.weightKg),
  );
  const [age, setAge] = useState(initial?.age?.toString() ?? "");
  const [heightCm, setHeight] = useState(initial?.heightCm?.toString() ?? "");
  const [weightKg, setWeight] = useState(initial?.weightKg?.toString() ?? "");
  const [restingHr, setRestingHr] = useState(
    initial?.restingHr?.toString() ?? "",
  );
  const [packWeightKg, setPackWeightKg] = useState(
    initial?.packWeightKg?.toString() ?? "5",
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          experience,
          typicalDistanceKm: Number(typicalDistanceKm),
          typicalElevationM: Number(typicalElevationM),
          // Keep engine aliases in sync for analyzeRoute.
          comfortableDistanceKm: Number(typicalDistanceKm),
          comfortableElevationM: Number(typicalElevationM),
          riskPreference,
          lastHikeAt: lastHikeAt || undefined,
          age: age ? Number(age) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          restingHr: restingHr ? Number(restingHr) : undefined,
          packWeightKg: packWeightKg ? Number(packWeightKg) : 5,
        });
      }}
    >
      <p className="text-xs leading-relaxed text-[var(--rock)]">
        这是你告诉系统的档案（OutdoorProfile），不是系统从活动中学到的
        Personal Model。舒适距离/爬升指「日归可重复」的水平，不是比赛极限。
      </p>

      <div>
        <label className="text-sm text-[var(--rock)]">徒步经验</label>
        <select
          className="field-input mt-1"
          value={experience}
          onChange={(e) => {
            const next = e.target.value as ExperienceLevel;
            const prevPreset = COMFORT_BY_EXPERIENCE[experience];
            const nextPreset = COMFORT_BY_EXPERIENCE[next];
            // Auto-shift only when sliders still match the previous level preset.
            if (
              typicalDistanceKm === prevPreset.distanceKm &&
              typicalElevationM === prevPreset.elevationM
            ) {
              setDistance(nextPreset.distanceKm);
              setElevation(nextPreset.elevationM);
            }
            setExperience(next);
          }}
        >
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">进阶</option>
          <option value="expert">资深</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">
          典型徒步距离（km）：{typicalDistanceKm}
        </label>
        <input
          type="range"
          min={3}
          max={COMFORT_DISTANCE_MAX_KM}
          value={typicalDistanceKm}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <p className="mt-1 text-xs text-[var(--rock)]">
          初级常见约 10 km；资深日归可至 {COMFORT_DISTANCE_MAX_KM} km
        </p>
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">
          典型爬升（m）：{typicalElevationM}
        </label>
        <input
          type="range"
          min={100}
          max={COMFORT_ELEVATION_MAX_M}
          step={50}
          value={typicalElevationM}
          onChange={(e) => setElevation(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <p className="mt-1 text-xs text-[var(--rock)]">
          初级常见约 500 m；资深日归可至 {COMFORT_ELEVATION_MAX_M} m
        </p>
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">最近一次徒步</label>
        <input
          type="date"
          value={lastHikeAt}
          onChange={(e) => setLastHikeAt(e.target.value)}
          className="field-input mt-1"
        />
      </div>

      <div>
        <label className="text-sm text-[var(--rock)]">风险偏好</label>
        <select
          className="field-input mt-1"
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
        className="cursor-pointer text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? "收起身体数据" : "可选：身高 / 体重 / 年龄 / 心率"}
      </button>

      {showMore ? (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["年龄", age, setAge],
              ["身高 cm", heightCm, setHeight],
              ["体重 kg", weightKg, setWeight],
              ["静息心率", restingHr, setRestingHr],
              ["负重 kg", packWeightKg, setPackWeightKg],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="text-sm text-[var(--rock)]">
              {label}
              <input
                type="number"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="field-input mt-1"
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          className="btn-primary min-h-12 px-5 py-3 text-sm"
        >
          生成个人预测
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-sm text-[var(--rock)] underline-offset-4 transition hover:underline"
        >
          跳过，用默认档案
        </button>
      </div>
    </form>
  );
}

# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that page file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Outdoor Copilot  
**Direction:** Alpine Dawn Editorial  
**Generated:** 2026-08-11  
**Category:** Outdoor personal intelligence · share-worthy · feminine-leaning cinematic  
**Design Dials:** Variance 5/10 | Motion 7–8/10 | Density 3/10 (Spacious)

---

## Intent

Make the product feel **refined, beautiful, and occasionally spectacular** — something outdoor women want to screenshot and post to Xiaohongshu. Not a spa pink app. Not generic AI cream/terracotta. Not purple glow SaaS.

## Style Synthesis (from ui-ux-pro-max)

| Source | Take |
|--------|------|
| Soft UI Evolution | Soft depth, clear contrast, 200–300ms transitions, focus-visible |
| Immersive / Storytelling | Full-bleed hero atmosphere, one composition |
| Wellness typography (Lora + Raleway) | Calm, organic, feminine-readable |
| Anti-patterns | No corporate templates, no neon, no harsh motion, no emoji icons |

## Color Palette (token-compatible)

Existing CSS tokens are **recolored** so product code keeps `--pine` / `--cream` names.

| Role | Hex | Token |
|------|-----|-------|
| Deep alpine (hero) | `#0C2226` | `--bg-deep` |
| Moss teal mid | `#163338` | `--bg-moss` |
| Mist pearl surface | `#F0F4F5` | `--cream` / `--background` |
| Ink | `#142428` | `--ink` |
| Soft ink | `rgba(20,36,40,0.68)` | `--ink-soft` |
| Teal accent | `#4A8A88` | `--pine` |
| Teal deep (primary btn) | `#1F4F52` | `--pine-deep` |
| Dusty rose CTA / share | `#C97B8A` | `--cta` |
| On CTA | `#FFFFFF` | `--cta-ink` |
| Dawn blush mist | `#E8D5D0` | `--dawn` |
| Mist text on dark | `#D7E4E6` | `--mist` |
| Rock muted | `#6A7375` | `--rock` |
| Border soft | `rgba(20,36,40,0.10)` | — |

## Typography

- **Display (Latin brand / scores):** Cormorant — editorial, high-contrast elegance  
- **Body UI:** Raleway — calm geometric, feminine without script fluff  
- **Chinese display / labels:** Noto Serif SC  

Avoid: Inter, Roboto, Great Vibes script, Playfair+cream cliché pairing as the whole look.

## Motion

1. Hero copy rise (stagger ~100ms)  
2. Hero media slow drift (respect `prefers-reduced-motion`)  
3. CTA soft pulse / hover lift 150–250ms  
4. Analyze list / report: `reveal-up` on enter  

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (expo-ish ease-out). Micro: 150–300ms. Do not animate layout width/height.

## Layout Rules

- Landing first viewport: brand + one line + one support + CTA group + full-bleed trail image only  
- No cards in hero; cards only for interactive report blocks  
- Spacious rhythm: 24 / 32 / 48 / 64  
- Touch targets ≥ 44px; `cursor-pointer` on clickables  
- Focus-visible rings using `--pine-deep`

## Share Surfaces

Xiaohongshu 3:4 card must match Alpine Dawn: deep teal header wash, pearl panel, dusty-rose score accent, elevation silhouette. Caption remains product copy; visuals carry desire to share.

## Avoid

- Pink spa / lavender purple luxury  
- Warm cream `#F4F1EA` + terracotta clusters  
- Purple-to-indigo SaaS gradients / glow stacks  
- Dense broadsheet columns  
- Emoji as icons  
---

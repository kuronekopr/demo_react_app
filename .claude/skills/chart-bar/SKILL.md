---
name: chart-bar
description: 棒グラフのReactコンポーネントをテンプレートから生成・確認する。src/services/chartTemplates.ts の buildBarChart を使い、安定した SVG コンポーネントコードを出力する。
argument-hint: [oldKwh] [newKwh] [savingsKwh] [savingsYen] [unitPrice] [roomSize]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# chart-bar — 棒グラフコンポーネント生成スキル

`src/services/chartTemplates.ts` の `buildBarChart` 関数を使って、エアコン年間消費電力比較の棒グラフ React コンポーネントコードを生成・確認する。

## 引数

| 引数 | 説明 | デフォルト値 |
|---|---|---|
| oldKwh | 旧型年間消費電力 (kWh) | 2383 |
| newKwh | 新型年間消費電力 (kWh) | 1922 |
| savingsKwh | 年間節約電力 (kWh) | 461 |
| savingsYen | 年間節約金額 (円) | 14291 |
| unitPrice | 電力単価 (円/kWh) | 31 |
| roomSize | 畳数ラベル | "20畳" |

## 手順

1. **引数をパース** して上記デフォルト値で補完する。

2. **`c:\demo_react_app\src\services\chartTemplates.ts`** を Read して `buildBarChart` の実装と `BarChartData` インターフェースを確認する。

3. **コードを生成・表示**: `buildBarChart` の計算をシミュレートして生成されるコードを ` ```jsx ` ブロックで表示する。
   - `maxVal = Math.ceil(oldKwh * 1.1 / 100) * 100`
   - `oldH = Math.round((oldKwh / maxVal) * 160)`
   - `newH = Math.round((newKwh / maxVal) * 160)`
   - `oldY = 200 - oldH`, `newY = 200 - newH`（必ず正の値になることを確認）

4. **ユーザーが確認を求めた場合**: 生成したコードを `c:\demo_react_app\src\components\BarChartPreview.tsx` に書き出す。確認後はこのファイルを削除するよう案内する。

5. **新しいデータをテンプレートに追加する場合**: `chartTemplates.ts` の `buildBarChart` の呼び出し側（`App.tsx` の `runDualModelGeneration`）を更新する手順を案内する:
   ```ts
   const rawCode = buildBarChart({
     oldKwh: <新しい値>,
     newKwh: <新しい値>,
     unitPrice: <単価>,
     savingsKwh: <節約kWh>,
     savingsYen: <節約円>,
     roomSize: '<畳数>',
   });
   ```

## 注意事項

- このスキルは LLM によるコード生成を行わない。TypeScript テンプレートから確定的にコードを生成する。
- 生成されたコードは `sanitizeCode()` + `wrapWithEmail()` を通じてメール本文と結合される。
- SVG の rect 要素の height は必ず正の値になる（TypeScript 側で計算済み）。

---
name: chart-line
description: 折れ線グラフのReactコンポーネントをテンプレートから生成・確認する。src/services/chartTemplates.ts の buildLineChart を使い、安定した SVG コンポーネントコードを出力する。
argument-hint: [oldKwh] [newKwh] [savingsKwh] [savingsYen] [unitPrice] [roomSize]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# chart-line — 折れ線グラフコンポーネント生成スキル

`src/services/chartTemplates.ts` の `buildLineChart` 関数を使って、エアコン月別消費電力比較の折れ線グラフ React コンポーネントコードを生成・確認する。

## 引数

| 引数 | 説明 | デフォルト値 |
|---|---|---|
| oldKwh | 旧型年間消費電力 (kWh) | 1390 |
| newKwh | 新型年間消費電力 (kWh) | 1032 |
| savingsKwh | 年間節約電力 (kWh) | 358 |
| savingsYen | 年間節約金額 (円) | 11098 |
| unitPrice | 電力単価 (円/kWh) | 31 |
| roomSize | 畳数ラベル | "12畳" |

月別データはデフォルト値を使用（引数として渡せない場合はテンプレートの定義値を使用）:
- oldMonthly: [92, 85, 95, 100, 108, 120, 148, 155, 130, 108, 92, 157]
- newMonthly: [68, 63, 70, 74, 80, 89, 110, 115, 96, 80, 68, 119]

## 手順

1. **引数をパース** して上記デフォルト値で補完する。

2. **`c:\demo_react_app\src\services\chartTemplates.ts`** を Read して `buildLineChart` の実装と `LineChartData` インターフェースを確認する。

3. **コードを生成・表示**: `buildLineChart` の計算をシミュレートして生成されるコードを ` ```jsx ` ブロックで表示する。
   - `maxV = Math.ceil(max(oldMonthly, newMonthly) * 1.1 / 10) * 10`
   - `xStep = 500 / 11`（12点、padL=40〜540の範囲）
   - `oldPts`, `newPts` は全座標をリテラル値として事前計算
   - `fillPts` は [...oldPts, ...[...newPts].reverse()] で生成

4. **ユーザーが確認を求めた場合**: 生成したコードを `c:\demo_react_app\src\components\LineChartPreview.tsx` に書き出す。確認後はこのファイルを削除するよう案内する。

5. **新しいデータをテンプレートに追加する場合**: `App.tsx` の `runDualModelGeneration` 内の `buildLineChart` 呼び出しを更新する手順を案内する。月別データを変更する際は `chartTemplates.ts` 内の `buildLineChart` 呼び出しではなく、`App.tsx` の呼び出し側の引数を変更する。

## 注意事項

- SVG の全座標（polyline の points, circle の cx/cy）は TypeScript 側で事前計算した数値リテラルとして埋め込まれる。
- `overflow: visible` が iframe CSS で設定済みなので、グラフが viewBox をわずかに超えても描画される。
- 月別データの合計と年間総量（oldKwh, newKwh）が一致しない場合、統計カードは年間値を優先して表示する。

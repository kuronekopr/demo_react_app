# NexusFlow プロジェクト環境情報定義書

`C:\demo_react_app` に構築された React 開発環境の情報をまとめました。本プロジェクトの開発・運用にあたっては、以下の設定情報を参照してください。

---

## 💻 動作環境 (System Environment)

| 項目 | 指定バージョン / 設定値 | 実機確認バージョン | 補足 |
| :--- | :--- | :--- | :--- |
| **OS** | Windows 11 | Windows 11 | - |
| **Node.js** | v24.16.0 | `v24.16.0` | `C:\nvm4w\nodejs` にインストール |
| **npm** | - | `v11.13.0` | Node.js v24 付属 |
| **npx** | - | `v11.13.0` | Node.js v24 付属 |

---

## 🛠️ ビルド・開発ツール (Build & Dev Tools)

| パッケージ名 | バージョン | 役割 |
| :--- | :--- | :--- |
| **create-vite** | `9.0.7` | プロジェクト初期化用 CLI イニシャライザ |
| **vite** | `8.0.14` | ローカル開発サーバー・ビルドエンジン本体 |
| **typescript** | `^5.7.2` | 静的型付け開発言語 |
| **@vitejs/plugin-react** | `^4.3.4` | React用のViteコンパイルプラグイン |

---

## 📦 主要パッケージ構成 (Dependencies)

| ライブラリ名 | バージョン | 役割 |
| :--- | :--- | :--- |
| **react** | `^19.0.0` | フロントエンド UI ライブラリ |
| **react-dom** | `^19.0.0` | DOM レンダリングエンジン |
| **lucide-react** | `^0.475.0` | 高品質な UI アイコンパック |

---

## 🚀 開発コマンド一覧 (Scripts)

Windows 環境で Node.js へのパスが一時的に通っていない問題を回避するため、以下のコマンドを使用して操作を行います。

### 1. 開発サーバーの起動
ローカルでデモアプリを動作させてブラウザで確認します。
```powershell
$env:PATH += ";C:\nvm4w\nodejs"; npm run dev
```
* **URL**: [http://localhost:5173](http://localhost:5173)

### 2. プロジェクトのビルド
本番用の静的ファイルをコンパイルして `dist` フォルダに出力します。
```powershell
$env:PATH += ";C:\nvm4w\nodejs"; npm run build
```

### 3. ビルド成果物のプレビュー
ビルドされた本番用の静的ファイルをローカルでホストして確認します。
```powershell
$env:PATH += ";C:\nvm4w\nodejs"; npm run preview
```

---

## 🔧 トラブルシューティング: コマンドが見つからない場合

PowerShell 起動時に `node` や `npm` コマンドが認識されない（`ObjectNotFound` エラー等）場合は、現在のターミナルセッションで以下のコマンドを実行してパスを通してください。

```powershell
$env:PATH += ";C:\nvm4w\nodejs"
```
実行後、`node -v` または `npm -v` が正常に動作するようになります。

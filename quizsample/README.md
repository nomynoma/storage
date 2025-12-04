# これなに
スプシからクイズだすやつのGASのコード
Claudeに基本を作ってもらって、ChatGPTに仕様をこねてもらったやつ
自分では何もコードを書いてない

# クイズアプリ（quiz_sample）

Google Apps Script と Google スプレッドシートを使用した6ジャンル・3段階クイズアプリケーションです。

## デモサイト

https://nomynoma.github.io/storage/quizsample/

## クイズの問題と選択肢、解答を保持してるスプシ
https://docs.google.com/spreadsheets/d/1Xycd1Wtq0ZNiQyhEIscRKndbyEeYt0H26wih9OXDJr8/edit?usp=sharing

## 概要

6つのジャンルから選択し、初級・中級・上級の3段階で挑戦するクイズシステムです。各レベルで10問全問正解すると次のレベルに進み、合格証明書が発行されます。

## 主な機能

### 基本機能
- **6つのジャンル**: ジャンル1〜6から選択可能
- **3段階のレベル**: 初級 → 中級 → 上級の順に挑戦
- **ニックネーム機能**: 最初にニックネームを入力し、合格証明書に表示
- **ランダム出題**: 各レベルから10問をランダムに抽出
- **選択肢シャッフル**: 問題ごとに選択肢の順序をランダム化
- **合格制**: 各レベル10問全問正解で次のレベルへ進める
- **合格証明書**: 各レベルクリア時にニックネーム・ジャンル名・日付入りの証明書を表示

### 問題形式
- **単一選択**: 1つの正解を選ぶ問題
- **複数選択**: 複数の正解を選ぶ問題（すべて選択して解答）
- **テキスト形式**: 文字での選択肢表示
- **画像形式**: 画像を選択肢として表示

### UI/UX
- レスポンシブデザイン（モバイル対応）
- 直感的な操作
- 即時フィードバック表示
- 進捗状況の表示
- 合格証明書エリアとボタンエリアを分離（スクリーンショット撮影しやすい）

### ソーシャル機能
- **X（Twitter）共有ボタン**: 合格時・不合格時にワンクリックで結果をシェア
- 合格時: ジャンル名・レベル・達成内容を投稿
- 不合格時: ジャンル名・レベル・スコア（何問正解か）を投稿
- OGP（Open Graph Protocol）対応でシェア時に画像とタイトルを表示

## ファイル構成

```
quiz_sample/
├── code.js              # バックエンド処理（Google Apps Script）
├── index.html           # フロントエンド（UI・ロジック）
├── appsscript.json      # Apps Script設定ファイル
└── .clasp.json          # Clasp設定ファイル

（プロジェクトルート）
└── index.html           # GitHub Pages用ラッパー（iframe + OGP設定）
```

## 技術仕様

### バックエンド（code.js）

**doGet()関数**
- Webアプリケーションのエントリーポイント
- HTMLファイルを配信

**getQuestions(genreName, level)関数**
- 指定されたジャンル（ジャンル1〜6）と難易度（初級/中級/上級）から問題を取得
- Fisher-Yatesアルゴリズムで問題と選択肢をシャッフル
- 最大10問を返す
- 選択肢シャッフル後も正解ラベルを正しく更新

### フロントエンド（quiz_sample/index.html）

**画面構成**
- ニックネーム入力画面
- ジャンル選択画面
- 問題画面
- 不合格画面
- 合格証明書画面（各レベルクリア時）
- ローディング画面

**主要機能**
- `submitNickname()`: ニックネーム検証・保存（10文字以内）
- `selectGenre()`: ジャンル選択
- `loadLevel()`: レベル別問題読み込み（非同期）
- `showQuestion()`: 問題表示（単一選択/複数選択/テキスト/画像対応）
- `checkAnswer()`: 単一選択の解答チェック
- `toggleChoice()` / `submitMultipleAnswer()`: 複数選択の処理
- `showSectionResult()`: レベル結果表示（合格/不合格判定）
- `showCertificate()`: 合格証明書表示（HTML形式・背景画像あり）
- `shareToX()`: X（Twitter）共有機能（合格時）
- `shareFailToX()`: X（Twitter）共有機能（不合格時）
- `nextSection()`: 次のレベルへ進む
- `retryLevel()`: 同じレベルをやり直す
- `restartQuiz()`: 最初からやり直す（ニックネーム入力画面へ）

**レスポンシブ対応**
- 600px以下でモバイルレイアウトに切り替え
- 画像選択肢は1カラムで表示
- フォントサイズとパディングを調整

### GitHub Pages用ラッパー（index.html）

**機能**
- Google Apps ScriptのWebアプリをiframeで全画面埋め込み
- OGP（Open Graph Protocol）メタタグ設定
- Twitter Card対応
- スマホでのスクロール防止処理

**OGP設定**
- タイトル: クイズアプリ - 6ジャンル・3段階
- 説明: 初級・中級・上級の3段階で挑戦！全問正解で合格証明書がもらえるよ！
- 画像: `https://nomynoma.github.io/storage/quizsample/imgs/ogp-image.png`
- URL: `https://nomynoma.github.io/storage/quizsample/`

## データ構造（Googleスプレッドシート想定）

各ジャンルシート（ジャンル1〜6）には以下の列が必要：

| 列 | 内容 | 例 |
|---|---|---|
| A | 問題番号 | 1 |
| B | 難易度 | 初級 / 中級 / 上級 |
| C | 選択タイプ | single / multiple |
| D | 表示タイプ | text / image |
| E | 問題文 | 「日本の首都は？」 |
| F | 選択肢A | 東京 |
| G | 選択肢B | 大阪 |
| H | 選択肢C | 名古屋 |
| I | 選択肢D | 福岡 |
| J | 正解 | A（複数の場合は「A,C」） |

### ジャンル構成

各ジャンルには初級・中級・上級それぞれ40問ずつ、合計120問を用意：

- **ジャンル1**: 掛け算（九九）
- **ジャンル2**: 足し算・引き算
- **ジャンル3**: 色の名前
- **ジャンル4**: 動物の知識
- **ジャンル5**: 日本の地理
- **ジャンル6**: 世界の国

## 合格証明書

各レベルクリア時に発行される合格証明書：

| レベル | 画像ファイル名 | 表示内容 |
|-------|--------------|---------|
| 初級合格 | `frame_hyousyoujyou_{ジャンル番号}-1.jpg` | 検定クイズ<br>ジャンル名 初級合格<br>ニックネーム殿<br>日付 |
| 中級合格 | `frame_hyousyoujyou_{ジャンル番号}-2.jpg` | 検定クイズ<br>ジャンル名 中級合格<br>ニックネーム殿<br>日付 |
| 上級全問正解 | `frame_hyousyoujyou_{ジャンル番号}-3.jpg` | 検定クイズ<br>ジャンル名 上級全問正解<br>ニックネーム殿<br>日付 |

**合格証明書の特徴**
- 背景画像の上にHTMLテキストをオーバーレイ表示
- 証明書エリアとボタンエリアを分離（スクリーンショット撮影用）
- X（Twitter）共有ボタン付き
- 次のレベルへ進むボタン（初級・中級）または最初からときなおすボタン（上級）
- テキストシャドウで視認性を向上

## デプロイ方法

### Google Apps Script側

1. Google スプレッドシートを作成
2. 「ジャンル1」〜「ジャンル6」の6つのシートを作成
3. 各シートに問題データを入力（各難易度40問ずつ）
4. 合格証明書画像（18枚）を用意してWebアクセス可能な場所にアップロード
5. `quiz_sample/code.js`の`SPREADSHEET_ID`を自分のスプレッドシートIDに変更
6. `quiz_sample/index.html`の合格証明書画像URLを更新（318行目）
7. Claspで`clasp push`を実行してデプロイ
8. Google Apps ScriptエディタでWebアプリケーションとして公開
9. デプロイURLを取得

### GitHub Pages側

1. プロジェクトルートの`index.html`の`<iframe src="...">`を上記デプロイURLに変更
2. OGP画像を`imgs/ogp-image.png`にアップロード
3. GitHub Pagesで公開
4. https://nomynoma.github.io/storage/quizsample/ でアクセス可能

### Clasp使用時の注意

- ファイル名は`index.html`（小文字）にすること
- `code.js`の`doGet()`関数内でも`'index'`（小文字）を参照

## 動作環境

- Google Apps Script
- Google スプレッドシート
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- モバイルブラウザ対応

## 技術スタック

- **バックエンド**: Google Apps Script
- **データベース**: Google スプレッドシート
- **フロントエンド**: HTML5 / CSS3 / Vanilla JavaScript
- **デプロイ**: Google Apps Script Webアプリ + GitHub Pages
- **開発ツール**: Clasp（Google Apps Script CLI）
- **ソーシャル連携**: Twitter Web Intent API
- **OGP**: Open Graph Protocol / Twitter Card

## 主な実装技術

- Fisher-Yatesアルゴリズムによる問題・選択肢のシャッフル
- `requestAnimationFrame()`を使った非同期レンダリング最適化
- レスポンシブデザイン（CSSメディアクエリ）
- 単一ページアプリケーション（SPA）パターン
- Google Apps Scriptの非同期通信（`google.script.run`）
- iframeを使ったクロスドメイン埋め込み

## ライセンス

このプロジェクトは個人利用・学習目的で作成されています。


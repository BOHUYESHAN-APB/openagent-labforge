# OpenAgent Labforge

> [!NOTE]
> **派生プロジェクトについて**
>
> OpenAgent Labforge は `code-yeongyu/oh-my-openagent`
> （旧 `oh-my-opencode`）の派生版です。
> このフォークでは、上流のライセンス境界と来歴を保ったまま、
> OpenCode ネイティブな委譲、研究ワークフロー、MCP の使い分け、
> ローカル優先の運用に重点を移しています。
>
> 来歴とライセンスは `LICENSE.md`、`NOTICE`、`THIRD_PARTY_NOTICES.md`、
> `docs/licensing.md` を参照してください。

## このフォークで現在強化されていること

この README は、上流の宣伝文や歴史ではなく、**今このプロジェクトが何を
できるか**に焦点を当てています。

### 1. Agent の役割分担が明確

- オーケストレーターと専門エージェントの境界を整理
- `task(subagent_type=...)` を OpenCode 上で確認可能な child session の正規経路として扱う
- 主な役割分担:
  - `librarian` -> 単一ライブラリ / フレームワーク / SDK の調査
  - `github-scout` -> リポジトリ比較と学習候補の抽出
  - `tech-scout` -> エコシステム / ベンチマーク / リリース分析
  - `article-writer` -> 公開向け技術文章
  - `scientific-writer` -> 研究・査読向け技術文章
- バックグラウンド委譲時の fallback-chain 管理も強化済み

### 2. 検索フローを「精度」と「広さ」で分離

- `websearch` -> 精度重視の検索
- `open_websearch_mcp` -> 多エンジンによる広い再現率
- `paper_search_mcp` -> 学術検索
- `context7` -> 公式ドキュメント / フレームワーク参照
- `grep_app` -> GitHub コード例

検索/分析モードの注入プロンプトも軽量化されており、明示的に選んだ専門
エージェントを無理に再ルーティングしないようになっています。

### 3. MCP の実運用を安定化

- `bing_cn_mcp` は `open_websearch_mcp` に置き換え済み
- `open_websearch_mcp` は `environment`、stdio、prompt-probe 互換、
  バージョン固定、起動タイムアウトを適切化
- `paper_search_mcp` は、この Windows/OpenCode 環境で実際に動いた
  ランチャ経路へ戻しています
- 精密検索 / 広域検索 / 学術検索の分担が明確です

### 4. Skill 検出を OpenCode 寄りに調整

- プロジェクトローカル skill は git ルート方向へ探索
- `SKILL.md` メタデータをより厳密に検証
- インストーラが `openagent-labforge` skill ディレクトリを自動生成し、
  プラグイン能力の発見を安定化

### 5. リリース面もフォーク実態に合わせて整理中

- ルート README は上流の宣伝コピーではなく、現行プロダクトの説明に変更
- インストーラ文言、パッケージメタデータ、schema メタデータも現行 fork に調整
- 現時点での推奨経路は **ローカル build + ローカル install**

## 現在の agent 構成

### 中核オーケストレーター

- `sisyphus`
- `hephaestus`
- `prometheus`
- `atlas`
- `sisyphus-junior`

### 専門エージェント

- `explore`
- `librarian`
- `github-scout`
- `tech-scout`
- `article-writer`
- `scientific-writer`
- 必要に応じて bio / multimodal 系 specialist

## 現在のインストール現実

現状は次の流れを前提にしています。

1. ローカル build
2. ローカル tgz を生成
3. OpenCode 設定ディレクトリ内のローカルプラグインを置き換える

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

詳細は `docs/guide/installation.md` を参照してください。

## ドキュメント入口

- `docs/guide/installation.md` - 現在のインストール / 置き換え手順
- `docs/guide/overview.md` - 現行プロダクト形態
- `docs/guide/orchestration.md` - 計画 / 実行 / 委譲の関係
- `docs/reference/configuration.md` - 設定リファレンス
- `docs/reference/features.md` - 機能一覧
- `examples/README.md` - 設定例 / bundle 例

## 現在の既知の制限

- まだローカル優先であり、公開 npm リリース導線は完成していません
- 一部の二次文書にはまだ上流由来の用語が残っています
- ブラウザ系 MCP は、検索・ドキュメント系 MCP より環境依存が強いです

## 来歴

- Upstream: `https://github.com/code-yeongyu/oh-my-openagent`
- Current fork: `https://github.com/BOHUYESHAN-APB/openagent-labforge`

もし下位文書と実際の挙動が食い違う場合は、この README と
`docs/guide/installation.md` を優先してください。

## 他言語版

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)

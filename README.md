# Voice Commander

音声認識とテキストコピー機能を備えたフローティングウィジェットアプリケーションです。

## 機能

- 🎤 ワンクリックで音声録音
- 🔄 OpenAI Whisper APIによる高精度な音声認識
- 📋 認識結果を自動でクリップボードにコピー
- 🌐 フローティングウィジェットモード
- ⌨️ グローバルホットキー（Ctrl+Shift+G）
- 🔐 安全なAPIキー管理

[Screencast from 2025年07月20日 07時28分55秒.webm](https://github.com/user-attachments/assets/5e62dc04-46be-414d-bacb-a6da075a3390)


## インストール

### AppImageを使用する場合（Linux）

1. [Releases](https://github.com/masahiro-kubota/voice-commander/releases)から最新のAppImageをダウンロード
2. 実行権限を付与：
   ```bash
   chmod +x Voice-Commander-*.AppImage
   ```
3. 実行：
   ```bash
   ./Voice-Commander-*.AppImage
   ```

### タスクバーに常駐させる方法（Linux）

AppImageをタスクバーに常駐させて簡単にアクセスできるようにする方法：

1. **AppImageを適切な場所に移動**
   ```bash
   mkdir -p ~/Applications
   mv ~/Downloads/Voice-Commander-*.AppImage ~/Applications/
   chmod +x ~/Applications/Voice-Commander-*.AppImage
   ```

2. **デスクトップエントリを作成**
   ```bash
   mkdir -p ~/.local/share/applications
   ```

   以下の内容で `~/.local/share/applications/voice-commander.desktop` を作成：
   ```ini
   [Desktop Entry]
   Version=1.0
   Type=Application
   Name=Voice Commander
   Comment=Voice transcription app with floating widget
   Exec=/home/YOUR_USERNAME/Applications/Voice-Commander-0.0.0-x86_64.AppImage
   Icon=/home/YOUR_USERNAME/Applications/Voice-Commander-0.0.0-x86_64.AppImage
   Terminal=false
   Categories=Utility;AudioVideo;
   StartupNotify=true
   ```
   ※ `YOUR_USERNAME` を実際のユーザー名に置き換えてください

3. **デスクトップデータベースを更新**
   ```bash
   update-desktop-database ~/.local/share/applications
   ```

4. **タスクバーに固定**
   - アプリケーションメニューから「Voice Commander」を検索して起動
   - 起動中のアプリアイコンを右クリック
   - 「タスクバーに固定」または「お気に入りに追加」を選択

5. **自動起動の設定（オプション）**
   ```bash
   mkdir -p ~/.config/autostart
   cp ~/.local/share/applications/voice-commander.desktop ~/.config/autostart/
   ```

## 開発環境でのセットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
git clone https://github.com/masahiro-kubota/voice-commander.git
cd voice-commander
npm install
```

### 開発サーバーの起動

```bash
# 通常モード
npm run dev

# フローティングモード
npm run dev:floating
```

### ビルド

```bash
# AppImageのビルド
npm run dist

# 全プラットフォーム向けビルド
npm run dist -- --linux --win --mac
```

## 使い方

1. **初回起動時**
   - フローティングボタンを右クリック
   - OpenAI APIキーを入力して保存

2. **音声認識**
   - フローティングボタンをクリックして録音開始
   - もう一度クリックで録音停止
   - 認識結果が自動的にクリップボードにコピーされます

3. **ホットキー**
   - `Ctrl+Shift+G`で録音の開始/停止

## トラブルシューティング

### APIキーが設定されていないエラー
- フローティングボタンを右クリックしてAPIキーを設定してください

### アイコンが表示されない
- デスクトップ環境によってはログアウト/ログインが必要な場合があります

## ライセンス

MIT License

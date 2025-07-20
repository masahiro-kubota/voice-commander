#!/bin/bash

# Voice Commander 完全インストールスクリプト
# 最新リリースのダウンロードからタスクバーへの追加まで一貫して行います

set -e

# カラー出力用の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ユーザー名の取得
USERNAME=$(whoami)

# アーキテクチャの検出
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH_SUFFIX="x86_64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    ARCH_SUFFIX="arm64"
else
    echo -e "${RED}エラー: サポートされていないアーキテクチャ: $ARCH${NC}"
    exit 1
fi

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Voice Commander インストーラー${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# 1. 最新リリースの情報を取得
echo -e "${YELLOW}1. 最新リリース情報を取得中...${NC}"
LATEST_RELEASE=$(curl -s https://api.github.com/repos/masahiro-kubota/voice-commander/releases/latest)

if [ -z "$LATEST_RELEASE" ] || [ "$LATEST_RELEASE" = "null" ]; then
    echo -e "${RED}エラー: 最新リリース情報を取得できませんでした${NC}"
    echo "手動でダウンロードしてから install-taskbar.sh を実行してください"
    exit 1
fi

# バージョン情報を取得
VERSION=$(echo "$LATEST_RELEASE" | grep -Po '"tag_name": "\K[^"]*')
echo -e "${GREEN}  最新バージョン: $VERSION${NC}"

# 2. AppImageのダウンロードURL を取得
echo -e "${YELLOW}2. ダウンロードURLを検索中...${NC}"
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep -Po '"browser_download_url": "\K[^"]*' | grep "AppImage" | grep "$ARCH_SUFFIX" | head -n 1)

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${RED}エラー: ${ARCH_SUFFIX} 用のAppImageが見つかりません${NC}"
    exit 1
fi

FILENAME=$(basename "$DOWNLOAD_URL")
echo -e "${GREEN}  ダウンロードファイル: $FILENAME${NC}"

# 3. ダウンロードディレクトリの準備
DOWNLOAD_DIR="$HOME/Downloads"
mkdir -p "$DOWNLOAD_DIR"
DOWNLOAD_PATH="$DOWNLOAD_DIR/$FILENAME"

# 古いバージョンのAppImageをチェック
echo -e "${YELLOW}3. 既存のVoice Commander AppImageを確認中...${NC}"
OLD_APPIMAGES=$(find "$DOWNLOAD_DIR" "$HOME/Applications" -name "Voice-Commander-*.AppImage" 2>/dev/null | grep -v "$FILENAME" || true)

if [ -n "$OLD_APPIMAGES" ]; then
    echo -e "${YELLOW}  古いバージョンが見つかりました:${NC}"
    echo "$OLD_APPIMAGES" | while read -r old_file; do
        echo "    - $(basename "$old_file")"
    done
    
    read -p "古いバージョンを削除しますか？ (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$OLD_APPIMAGES" | while read -r old_file; do
            rm -f "$old_file"
            echo -e "${GREEN}    削除: $(basename "$old_file")${NC}"
        done
    fi
fi

# 既にダウンロード済みかチェック
if [ -f "$DOWNLOAD_PATH" ]; then
    echo -e "${YELLOW}  最新版は既にダウンロード済みです${NC}"
    read -p "再ダウンロードしますか？ (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}  既存のファイルを使用します${NC}"
    else
        rm -f "$DOWNLOAD_PATH"
        echo -e "${YELLOW}  ダウンロード中...${NC}"
        curl -L --progress-bar -o "$DOWNLOAD_PATH" "$DOWNLOAD_URL"
        echo -e "${GREEN}  ダウンロード完了${NC}"
    fi
else
    echo -e "${YELLOW}  AppImageをダウンロード中...${NC}"
    curl -L --progress-bar -o "$DOWNLOAD_PATH" "$DOWNLOAD_URL"
    echo -e "${GREEN}  ダウンロード完了${NC}"
fi

# 4. インストールスクリプトの実行
echo ""
echo -e "${YELLOW}4. インストールを開始します...${NC}"
echo ""

# install-taskbar.sh の内容をインライン実行
APPIMAGE_FULLPATH=$(realpath "$DOWNLOAD_PATH")
APPIMAGE_FILENAME=$(basename "$DOWNLOAD_PATH")

# Applicationsディレクトリの作成
echo -e "${YELLOW}  Applicationsディレクトリを作成中...${NC}"
mkdir -p ~/Applications

# AppImageを移動（既に~/Applicationsにある場合はスキップ）
if [[ "$APPIMAGE_FULLPATH" != "$HOME/Applications/"* ]]; then
    echo -e "${YELLOW}  AppImageをApplicationsディレクトリにコピー中...${NC}"
    cp "$APPIMAGE_FULLPATH" ~/Applications/
    APPIMAGE_FULLPATH="$HOME/Applications/$APPIMAGE_FILENAME"
else
    echo -e "${GREEN}  AppImageは既にApplicationsディレクトリにあります${NC}"
fi

# 実行権限を付与
echo -e "${YELLOW}  実行権限を付与中...${NC}"
chmod +x "$APPIMAGE_FULLPATH"

# アイコンを抽出（オプション）
echo -e "${YELLOW}  アイコンを抽出中...${NC}"
ICON_PATH="$HOME/.local/share/icons/voice-commander.png"
mkdir -p ~/.local/share/icons

# AppImageからアイコンを抽出する試み
if command -v appimageextract >/dev/null 2>&1; then
    # 一時ディレクトリで抽出
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    "$APPIMAGE_FULLPATH" --appimage-extract >/dev/null 2>&1 || true
    
    # アイコンを探す
    if [ -d "squashfs-root" ]; then
        ICON_FILE=$(find squashfs-root -name "*.png" -o -name "*.svg" | grep -E "(icon|logo)" | head -n 1)
        if [ -n "$ICON_FILE" ] && [ -f "$ICON_FILE" ]; then
            cp "$ICON_FILE" "$ICON_PATH"
            echo -e "${GREEN}    アイコンを抽出しました${NC}"
        fi
    fi
    
    cd - >/dev/null
    rm -rf "$TEMP_DIR"
fi

# アイコンが抽出できなかった場合はAppImage自体を使用
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="$APPIMAGE_FULLPATH"
    echo -e "${YELLOW}    アイコンの抽出に失敗しました。AppImageファイルをアイコンとして使用します${NC}"
fi

# 既存のデスクトップエントリをチェック
DESKTOP_FILE="$HOME/.local/share/applications/voice-commander.desktop"
if [ -f "$DESKTOP_FILE" ]; then
    echo -e "${YELLOW}  既存のデスクトップエントリを更新中...${NC}"
    # 古いExecパスを新しいパスに更新
    sed -i "s|^Exec=.*|Exec=\"$APPIMAGE_FULLPATH\"|" "$DESKTOP_FILE"
    sed -i "s|^Icon=.*|Icon=$ICON_PATH|" "$DESKTOP_FILE"
    echo -e "${GREEN}    デスクトップエントリを更新しました${NC}"
else
    # デスクトップエントリの作成
    echo -e "${YELLOW}  デスクトップエントリを作成中...${NC}"
    mkdir -p ~/.local/share/applications

    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Voice Commander
Comment=Voice transcription app with floating widget
Exec="$APPIMAGE_FULLPATH"
Icon=$ICON_PATH
Terminal=false
Categories=Utility;AudioVideo;
StartupNotify=true
Keywords=voice;transcription;whisper;audio;recorder;
EOF

    echo -e "${GREEN}    デスクトップエントリを作成しました${NC}"
fi

# デスクトップデータベースの更新
echo -e "${YELLOW}  デスクトップデータベースを更新中...${NC}"
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database ~/.local/share/applications
    echo -e "${GREEN}    データベースを更新しました${NC}"
else
    echo -e "${YELLOW}    update-desktop-databaseが見つかりません（一部の環境では不要です）${NC}"
fi

# 自動起動の設定（オプション）
echo ""
read -p "システム起動時に自動的に起動しますか？ (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}  自動起動を設定中...${NC}"
    mkdir -p ~/.config/autostart
    cp "$DESKTOP_FILE" ~/.config/autostart/
    echo -e "${GREEN}    自動起動を設定しました${NC}"
fi

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ インストールが完了しました！${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}次の手順でタスクバーに固定してください：${NC}"
echo "1. アプリケーションメニューから「Voice Commander」を検索"
echo "2. アプリケーションを起動"
echo "3. タスクバーのアイコンを右クリック"
echo "4. 「タスクバーに固定」または「お気に入りに追加」を選択"
echo ""
echo -e "${YELLOW}注意: デスクトップ環境によってはログアウト/ログインが必要な場合があります${NC}"
echo ""
echo -e "${BLUE}Voice Commanderを今すぐ起動しますか？${NC}"
read -p "(y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Voice Commanderを起動中...${NC}"
    nohup "$APPIMAGE_FULLPATH" >/dev/null 2>&1 &
    echo -e "${GREEN}起動しました！${NC}"
fi
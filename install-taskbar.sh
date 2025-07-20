#!/bin/bash

# Voice Commander タスクバーインストールスクリプト

set -e

# カラー出力用の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ユーザー名の取得
USERNAME=$(whoami)

# AppImageファイルを探す
APPIMAGE_FILE=""
if [ -n "$1" ]; then
    # 引数でAppImageファイルが指定された場合
    APPIMAGE_FILE="$1"
else
    # カレントディレクトリでAppImageを探す
    APPIMAGE_FILE=$(find . -maxdepth 1 -name "Voice-Commander-*.AppImage" | head -n 1)
    
    if [ -z "$APPIMAGE_FILE" ]; then
        # Downloadsフォルダでも探す
        APPIMAGE_FILE=$(find ~/Downloads -maxdepth 1 -name "Voice-Commander-*.AppImage" 2>/dev/null | head -n 1)
    fi
fi

# AppImageが見つからない場合
if [ -z "$APPIMAGE_FILE" ] || [ ! -f "$APPIMAGE_FILE" ]; then
    echo -e "${RED}エラー: Voice Commander AppImageファイルが見つかりません。${NC}"
    echo "使用方法: $0 [AppImageファイルパス]"
    echo ""
    echo "例: $0 ~/Downloads/Voice-Commander-0.0.0-x86_64.AppImage"
    exit 1
fi

# AppImageのフルパスを取得
APPIMAGE_FULLPATH=$(realpath "$APPIMAGE_FILE")
APPIMAGE_FILENAME=$(basename "$APPIMAGE_FILE")

echo -e "${GREEN}Voice Commander タスクバーインストーラー${NC}"
echo "AppImageファイル: $APPIMAGE_FULLPATH"
echo ""

# 1. Applicationsディレクトリの作成
echo -e "${YELLOW}1. Applicationsディレクトリを作成中...${NC}"
mkdir -p ~/Applications

# 2. AppImageを移動（既に~/Applicationsにある場合はスキップ）
if [[ "$APPIMAGE_FULLPATH" != "$HOME/Applications/"* ]]; then
    echo -e "${YELLOW}2. AppImageをApplicationsディレクトリに移動中...${NC}"
    cp "$APPIMAGE_FULLPATH" ~/Applications/
    APPIMAGE_FULLPATH="$HOME/Applications/$APPIMAGE_FILENAME"
else
    echo -e "${GREEN}2. AppImageは既にApplicationsディレクトリにあります${NC}"
fi

# 3. 実行権限を付与
echo -e "${YELLOW}3. 実行権限を付与中...${NC}"
chmod +x "$APPIMAGE_FULLPATH"

# 4. アイコンを抽出（オプション）
echo -e "${YELLOW}4. アイコンを抽出中...${NC}"
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
            echo -e "${GREEN}  アイコンを抽出しました${NC}"
        fi
    fi
    
    cd - >/dev/null
    rm -rf "$TEMP_DIR"
fi

# アイコンが抽出できなかった場合はAppImage自体を使用
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="$APPIMAGE_FULLPATH"
    echo -e "${YELLOW}  アイコンの抽出に失敗しました。AppImageファイルをアイコンとして使用します${NC}"
fi

# 5. デスクトップエントリの作成
echo -e "${YELLOW}5. デスクトップエントリを作成中...${NC}"
mkdir -p ~/.local/share/applications

DESKTOP_FILE="$HOME/.local/share/applications/voice-commander.desktop"

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

echo -e "${GREEN}  デスクトップエントリを作成しました${NC}"

# 6. デスクトップデータベースの更新
echo -e "${YELLOW}6. デスクトップデータベースを更新中...${NC}"
update-desktop-database ~/.local/share/applications

# 7. 自動起動の設定（オプション）
echo ""
read -p "システム起動時に自動的に起動しますか？ (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}自動起動を設定中...${NC}"
    mkdir -p ~/.config/autostart
    cp "$DESKTOP_FILE" ~/.config/autostart/
    echo -e "${GREEN}  自動起動を設定しました${NC}"
fi

echo ""
echo -e "${GREEN}✅ インストールが完了しました！${NC}"
echo ""
echo "次の手順でタスクバーに固定してください："
echo "1. アプリケーションメニューから「Voice Commander」を検索"
echo "2. アプリケーションを起動"
echo "3. タスクバーのアイコンを右クリック"
echo "4. 「タスクバーに固定」または「お気に入りに追加」を選択"
echo ""
echo -e "${YELLOW}注意: デスクトップ環境によってはログアウト/ログインが必要な場合があります${NC}"
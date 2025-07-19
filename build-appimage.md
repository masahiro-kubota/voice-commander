# AppImage ビルド手順

## 1. ビルド前の準備

### アイコンファイルの作成
```bash
mkdir -p build
# 512x512以上のPNGアイコンを build/icon.png として配置
```

## 2. ビルドコマンド

### Linux環境でのビルド
```bash
# 依存関係のインストール
npm install

# AppImageのビルド
npm run dist
```

### 他のOSからLinux向けビルド（Docker使用）
```bash
# electron-builderのDockerイメージを使用
docker run --rm -ti \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine

# コンテナ内で実行
cd /project
npm install
npm run dist
```

## 3. 出力ファイル

ビルドが成功すると、以下のファイルが生成されます：
- `dist-electron/Voice-Commander-0.0.0-x64.AppImage` (x64版)
- `dist-electron/Voice-Commander-0.0.0-arm64.AppImage` (ARM64版)

## 4. AppImageの実行

```bash
# 実行権限を付与
chmod +x dist-electron/Voice-Commander-*.AppImage

# 実行
./dist-electron/Voice-Commander-0.0.0-x64.AppImage
```

## 5. 配布

生成されたAppImageファイルをそのまま配布できます。ユーザーは実行権限を付与するだけで使用可能です。

## トラブルシューティング

### アイコンが表示されない場合
- `build/icon.png` が512x512以上のPNGファイルであることを確認
- 透過PNGを使用することを推奨

### ビルドエラーが発生する場合
- Node.jsのバージョンが適切か確認（推奨: v18以上）
- `node_modules` を削除して `npm install` を再実行

### AppImageが起動しない場合
- 実行権限が付与されているか確認
- 必要なシステムライブラリがインストールされているか確認
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Commander is an Electron-based desktop application that provides voice transcription capabilities through a floating widget interface. It uses OpenAI's Whisper API for voice-to-text conversion.

## Architecture

### Technology Stack
- **Frontend**: React 19.1.0 with TypeScript, Material-UI v7.2.0
- **Desktop Framework**: Electron 37.2.3
- **Build Tool**: Vite 7.0.4
- **Voice API**: OpenAI Whisper API
- **Package Format**: AppImage for Linux (x64, ARM64)

### Key Components

1. **Main Process** (`electron/`)
   - `main.cjs`: Entry point with mode switching logic (normal/floating)
   - `floatingMain.cjs`: Handles floating widget window creation
   - `hotkeyManager.cjs`: Global hotkey registration (Ctrl+Shift+G)
   - `openai-service.cjs`: Whisper API integration
   - `preload.cjs`: IPC communication bridge

2. **Renderer Process** (`src/`)
   - `App.tsx`: Main application window
   - `FloatingApp.tsx`: Floating widget interface
   - `components/`: Reusable UI components
   - `types/`: TypeScript definitions

3. **Entry Points**
   - `index.html`: Main application
   - `floating.html`: Floating widget
   - `apikey.html`: API key configuration

## Development Commands

### Running Development Server

```bash
# Normal window mode
npm run dev

# Floating widget mode
npm run dev:floating

# Floating mode with debug
npm run dev:floating-debug
```

### Building

```bash
# Build frontend and prepare for distribution
npm run build

# Create AppImage distribution
npm run dist
```

### Code Quality

```bash
# Run ESLint
npm run lint

# TypeScript type checking (via build)
npm run build:vite
```

## Important Development Notes

### Test-Driven Development (TDD)
**Note**: The project currently lacks a test framework. When implementing features:
1. Consider setting up a test framework (Jest/Vitest) first
2. Write tests before implementation
3. Follow TDD principles as specified in global CLAUDE.md

### IPC Communication
The app uses Electron's IPC for communication between main and renderer processes:
- `window.electronAPI` exposes secure methods via preload script
- Key channels: `transcribe-audio`, `get-api-key`, `save-api-key`, `register-global-shortcut`

### Window Management
The app supports two window modes:
- **Normal Mode**: Standard application window
- **Floating Mode**: Always-on-top widget (150x150px)

Mode is determined by:
1. `FLOATING_MODE` environment variable during development
2. Command line argument `--floating` in production

### API Key Storage
API keys are stored securely using Electron's safeStorage API:
- Encrypted when supported by the OS
- Stored in app's user data directory

### Build Configuration
- TypeScript strict mode is enabled
- No unused locals/parameters allowed
- ESM modules in frontend, CommonJS in Electron main process
- Vite handles frontend bundling with hot module replacement

### State Management
- React hooks for local state
- No global state management library
- API key state managed through IPC calls

## Common Tasks

### Adding a New IPC Channel
1. Define the channel in `electron/preload.cjs`
2. Add handler in appropriate main process file
3. Add TypeScript types in `src/types/electron.d.ts`
4. Use via `window.electronAPI` in React components

### Modifying the Floating Widget
1. Edit `src/FloatingApp.tsx` for UI changes
2. Adjust window properties in `electron/floatingMain.cjs`
3. Test with `npm run dev:floating`

### Updating Dependencies
1. Check Electron version compatibility first
2. Update React and MUI together to avoid conflicts
3. Test both normal and floating modes after updates

## Release Process

Releases are automated via GitHub Actions:
1. Tag a commit with version (e.g., `v1.0.0`)
2. GitHub Actions builds for Linux (x64, ARM64)
3. AppImage artifacts are uploaded to release

Manual release: `npm run dist`
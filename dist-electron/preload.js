"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// APIをレンダラープロセスに公開
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 必要に応じてIPCメソッドを追加
    sendMessage: (channel, data) => {
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    onMessage: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
});

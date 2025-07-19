const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

class OpenAIService {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);
        
        // APIキーが暗号化されている場合は復号化
        if (config.encryptedApiKey && safeStorage.isEncryptionAvailable()) {
          const encrypted = Buffer.from(config.encryptedApiKey, 'base64');
          config.apiKey = safeStorage.decryptString(encrypted);
        }
        
        return config;
      }
    } catch (error) {
      console.error('設定ファイルの読み込みエラー:', error);
    }
    return {};
  }

  saveConfig() {
    try {
      const configToSave = { ...this.config };
      
      // APIキーを暗号化して保存
      if (configToSave.apiKey && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(configToSave.apiKey);
        configToSave.encryptedApiKey = encrypted.toString('base64');
        delete configToSave.apiKey; // 平文のAPIキーは保存しない
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
      return true;
    } catch (error) {
      console.error('設定ファイルの保存エラー:', error);
      return false;
    }
  }

  getApiKey() {
    return this.config.apiKey || '';
  }

  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    return this.saveConfig();
  }

  validateApiKey(apiKey) {
    // 基本的な検証（OpenAI APIキーの形式）
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // OpenAI APIキーは通常 "sk-" で始まる
    return apiKey.startsWith('sk-') && apiKey.length > 20;
  }

  async testApiKey(apiKey) {
    try {
      // OpenAI APIに簡単なリクエストを送信してキーを検証
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('APIキーのテストエラー:', error);
      return false;
    }
  }

  // WhisperAPIを使った文字起こし（メインプロセス側で実行）
  async transcribeAudio(audioBuffer, options = {}) {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }

    // FormDataを使用するため、node-fetchとform-dataが必要
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const formData = new FormData();
    
    // Uint8ArrayをBufferに変換
    const buffer = Buffer.from(audioBuffer);
    formData.append('file', buffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.responseFormat) {
      formData.append('response_format', options.responseFormat);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'APIリクエストに失敗しました');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('文字起こしエラー:', error);
      throw error;
    }
  }
}

module.exports = OpenAIService;
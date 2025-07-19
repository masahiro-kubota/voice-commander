import OpenAI from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // ブラウザ環境での使用を許可
});

export interface TranscriptionResult {
  text: string;
  language?: string;
}

export interface TranscriptionError {
  error: string;
  details?: any;
}

/**
 * 音声ファイルを文字起こしする
 * @param audioBlob 音声データのBlob
 * @param language 言語コード（省略可能、省略時は自動検出）
 * @returns 文字起こし結果
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language?: string
): Promise<TranscriptionResult> {
  try {
    // APIキーの確認
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI APIキーが設定されていません。.env.localファイルにVITE_OPENAI_API_KEYを設定してください。');
    }

    // BlobをFileに変換（OpenAI APIはFileオブジェクトを期待）
    const audioFile = new File([audioBlob], 'audio.webm', {
      type: audioBlob.type || 'audio/webm'
    });

    console.log('音声ファイルサイズ:', audioFile.size, 'bytes');
    console.log('音声ファイルタイプ:', audioFile.type);

    // OpenAI Whisper APIを呼び出し
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined, // 言語指定（省略時は自動検出）
      response_format: 'verbose_json' // 詳細な結果を取得
    });

    // 結果を返す
    return {
      text: transcription.text.trim(),
      language: transcription.language
    };
  } catch (error: any) {
    console.error('文字起こしエラー:', error);
    
    // エラーメッセージを整形
    let errorMessage = '文字起こし中にエラーが発生しました';
    
    if (error.status === 401) {
      errorMessage = 'APIキーが無効です。正しいAPIキーを設定してください。';
    } else if (error.status === 429) {
      errorMessage = 'APIの利用制限に達しました。しばらく待ってから再試行してください。';
    } else if (error.status === 413) {
      errorMessage = 'ファイルサイズが大きすぎます。25MB以下のファイルを使用してください。';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * サポートされている音声フォーマットかチェック
 * @param mimeType MIMEタイプ
 * @returns サポートされているかどうか
 */
export function isSupportedAudioFormat(mimeType: string): boolean {
  const supportedFormats = [
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/mpga',
    'audio/m4a',
    'audio/wav',
    'audio/ogg',
    'video/webm' // ブラウザのMediaRecorderがvideo/webmで録音することがある
  ];
  
  return supportedFormats.includes(mimeType.toLowerCase());
}

/**
 * 音声の長さを秒単位で取得（推定）
 * @param audioBlob 音声データのBlob
 * @returns 推定音声長（秒）
 */
export async function estimateAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      // エラーの場合はサイズから推定（webmの場合、約10KB/秒）
      resolve(audioBlob.size / 10000);
    });
    
    audio.src = url;
  });
}
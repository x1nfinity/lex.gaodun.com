import React, { useState } from 'react';
import { useText2Video } from './hooks/useText2Video';
import { GenerationStep } from './services/text2video';
import './App.css';

const App: React.FC = () => {
  const [word, setWord] = useState<string>('');
  const { 
    isLoading, 
    currentStep, 
    progressMessage, 
    error, 
    result, 
    generateVideo, 
    reset 
  } = useText2Video();

  const handleGenerate = async () => {
    if (!word.trim()) {
      return;
    }
    await generateVideo(word);
  };

  return (
    <div className="app">
      <div className="container">
        <h1>单词转视频生成器</h1>
        <p className="subtitle">输入英语单词，生成有趣的记忆视频</p>
        
        <div className="input-section">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="请输入英语单词，如：apple"
            className="word-input"
            disabled={isLoading}
          />
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !word.trim()}
            className="generate-btn"
          >
            {isLoading ? '生成中...' : '生成视频'}
          </button>
        </div>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>{progressMessage}</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={reset} className="reset-btn">重试</button>
          </div>
        )}

        {result && result.script && (
          <div className="result">
            <h2>生成结果</h2>
            
            <div className="script-info">
              <h3>记忆方法</h3>
              <p><strong>谐音短语：</strong>{result.script.mnemonic_phrase}</p>
              <p><strong>故事脚本：</strong>{result.script.story_script}</p>
              <p><strong>配音文本：</strong>{result.script.voiceover_text}</p>
              
              <h4>关键画面：</h4>
              <ul>
                {result.script.key_frames.map((frame, index) => (
                  <li key={index}>{frame}</li>
                ))}
              </ul>
            </div>

            <div className="video-section">
              <h3>生成的视频</h3>
              {result.videoUrl ? (
                <div>
                  <video 
                    controls 
                    width="480" 
                    height="270"
                    className="generated-video"
                  >
                    <source src={result.videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                  <div className="video-link">
                    <p><strong>视频链接：</strong></p>
                    <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="video-url">
                      {result.videoUrl}
                    </a>
                  </div>
                </div>
              ) : (
                <p>视频生成中...</p>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default App;
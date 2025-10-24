import React, { useState } from 'react';
import { useText2Video } from '../src/hooks/useText2Video';

/**
 * 简单的文本转视频组件示例
 * 展示如何使用 useText2Video Hook
 */
function SimpleVideoGenerator() {
  const [word, setWord] = useState('');
  
  const {
    isLoading,
    currentStep,
    progressMessage,
    error,
    result,
    generateVideo,
    reset
  } = useText2Video({
    pollingInterval: 15000,
    maxPollingAttempts: 20
  });

  const handleGenerate = async () => {
    if (!word.trim()) return;
    await generateVideo(word);
  };

  const handleReset = () => {
    setWord('');
    reset();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>文本转视频生成器</h2>
      
      {/* 输入区域 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="请输入英语单词，如：apple"
          style={{
            width: '70%',
            padding: '10px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !word.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '生成中...' : '生成视频'}
        </button>
      </div>

      {/* 进度显示 */}
      {isLoading && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p><strong>当前步骤:</strong> {currentStep}</p>
          <p><strong>进度信息:</strong> {progressMessage}</p>
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
          <button
            onClick={handleReset}
            style={{
              marginTop: '10px',
              padding: '5px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* 结果显示 */}
      {result && result.script && (
        <div style={{
          padding: '20px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          <h3>生成结果</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>记忆方法</h4>
            <p><strong>谐音短语:</strong> {result.script.mnemonic_phrase}</p>
            <p><strong>故事脚本:</strong> {result.script.story_script}</p>
            <p><strong>配音文本:</strong> {result.script.voiceover_text}</p>
            
            <h5>关键画面:</h5>
            <ul>
              {result.script.key_frames.map((frame, index) => (
                <li key={index}>{frame}</li>
              ))}
            </ul>
          </div>

          {result.videoUrl && (
            <div>
              <h4>生成的视频</h4>
              <video
                controls
                width="100%"
                style={{ maxWidth: '480px' }}
              >
                <source src={result.videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
              <p>
                <strong>视频链接:</strong>{' '}
                <a href={result.videoUrl} target="_blank" rel="noopener noreferrer">
                  {result.videoUrl}
                </a>
              </p>
            </div>
          )}
          
          <button
            onClick={handleReset}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            生成新视频
          </button>
        </div>
      )}
    </div>
  );
}

export default SimpleVideoGenerator;
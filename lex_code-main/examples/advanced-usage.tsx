import React, { useState, useEffect } from 'react';
import { Text2VideoService, GenerationStep, type Text2VideoResult } from '../src/services/text2video';

/**
 * 高级文本转视频组件示例
 * 展示如何直接使用 Text2VideoService 类
 * 包含自定义进度显示、错误处理和配置管理
 */
function AdvancedVideoGenerator() {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Text2VideoResult | null>(null);
  const [service, setService] = useState<Text2VideoService | null>(null);
  
  // 配置状态
  const [config, setConfig] = useState({
    pollingInterval: 15000,
    maxPollingAttempts: 20
  });

  // 初始化服务
  useEffect(() => {
    const newService = new Text2VideoService(config);
    setService(newService);
  }, [config]);

  const getStepMessage = (step: GenerationStep): string => {
    switch (step) {
      case GenerationStep.GENERATING_SCRIPT:
        return '正在生成记忆脚本...';
      case GenerationStep.SCRIPT_GENERATED:
        return '脚本生成完成，开始生成视频...';
      case GenerationStep.GENERATING_VIDEO:
        return '正在创建视频任务...';
      case GenerationStep.POLLING_VIDEO:
        return '视频生成中，请耐心等待...';
      case GenerationStep.COMPLETED:
        return '视频生成完成！';
      case GenerationStep.ERROR:
        return '生成过程中出现错误';
      default:
        return '准备就绪';
    }
  };

  const handleGenerate = async () => {
    if (!word.trim() || !service) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(GenerationStep.IDLE);

    try {
      const result = await service.generateVideo(word, {
        onStepChange: (step) => {
          setCurrentStep(step);
          setProgressMessage(getStepMessage(step));
        },
        onProgress: (message) => {
          setProgressMessage(message);
        },
        onError: (error) => {
          setError(error);
          setCurrentStep(GenerationStep.ERROR);
        },
        onComplete: (result) => {
          setResult(result);
          setCurrentStep(GenerationStep.COMPLETED);
        }
      });

      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setCurrentStep(GenerationStep.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWord('');
    setIsLoading(false);
    setCurrentStep(GenerationStep.IDLE);
    setProgressMessage('');
    setError(null);
    setResult(null);
  };

  const updateConfig = (newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getProgressPercentage = (): number => {
    switch (currentStep) {
      case GenerationStep.GENERATING_SCRIPT:
        return 20;
      case GenerationStep.SCRIPT_GENERATED:
        return 40;
      case GenerationStep.GENERATING_VIDEO:
        return 60;
      case GenerationStep.POLLING_VIDEO:
        return 80;
      case GenerationStep.COMPLETED:
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>高级文本转视频生成器</h2>
      
      {/* 配置区域 */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h4>配置设置</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label>
            轮询间隔 (秒):
            <input
              type="number"
              value={config.pollingInterval / 1000}
              onChange={(e) => updateConfig({ pollingInterval: Number(e.target.value) * 1000 })}
              min="5"
              max="60"
              style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
              disabled={isLoading}
            />
          </label>
          <label>
            最大轮询次数:
            <input
              type="number"
              value={config.maxPollingAttempts}
              onChange={(e) => updateConfig({ maxPollingAttempts: Number(e.target.value) })}
              min="5"
              max="50"
              style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      {/* 输入区域 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="请输入英语单词，如：apple"
          style={{
            width: '70%',
            padding: '12px',
            marginRight: '10px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px'
          }}
          disabled={isLoading}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !word.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? '生成中...' : '生成视频'}
        </button>
      </div>

      {/* 进度显示 */}
      {isLoading && (
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>当前步骤:</strong> {currentStep}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>进度信息:</strong> {progressMessage}
          </div>
          
          {/* 进度条 */}
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgressPercentage()}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease',
              borderRadius: '10px'
            }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px' }}>
            {getProgressPercentage()}%
          </div>
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#721c24', margin: '0 0 10px 0' }}>生成失败</h4>
          <p style={{ color: '#721c24', margin: '0 0 15px 0' }}>{error}</p>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重新开始
          </button>
        </div>
      )}

      {/* 结果显示 */}
      {result && result.script && (
        <div style={{
          padding: '25px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px'
        }}>
          <h3 style={{ marginTop: 0 }}>生成结果</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div>
              <h4>脚本信息</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>谐音短语:</strong> {result.script.mnemonic_phrase}</p>
                <p><strong>配音文本:</strong> {result.script.voiceover_text}</p>
              </div>
            </div>
            
            <div>
              <h4>关键画面</h4>
              <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {result.script.key_frames.map((frame, index) => (
                  <li key={index}>{frame}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4>故事脚本</h4>
            <p style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              lineHeight: '1.6'
            }}>
              {result.script.story_script}
            </p>
          </div>

          {result.videoUrl && (
            <div style={{ marginTop: '25px' }}>
              <h4>生成的视频</h4>
              <video
                controls
                width="100%"
                style={{ maxWidth: '600px', borderRadius: '6px' }}
              >
                <source src={result.videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
              <div style={{ marginTop: '15px' }}>
                <strong>视频链接:</strong>{' '}
                <a 
                  href={result.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ wordBreak: 'break-all' }}
                >
                  {result.videoUrl}
                </a>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              生成新视频
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedVideoGenerator;
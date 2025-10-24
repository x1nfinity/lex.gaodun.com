import { useState, useCallback } from 'react';
import { 
  Text2VideoService, 
  GenerationStep, 
  type Text2VideoResult, 
  type Text2VideoConfig,
  type ProgressCallback 
} from '../services/text2video';
import { getAllAIModels, AIModelConfig } from '../config/prompts';

// Hook状态接口
export interface UseText2VideoState {
  isLoading: boolean;
  currentStep: GenerationStep;
  progressMessage: string;
  error: string | null;
  result: Text2VideoResult | null;
  availableModels: AIModelConfig[];
  selectedModel: string;
}

// Hook操作接口
export interface UseText2VideoActions {
  generateVideo: (text: string, templateId?: string, modelId?: string) => Promise<void>;
  reset: () => void;
  updateConfig: (config: Partial<Text2VideoConfig>) => void;
  setSelectedModel: (modelId: string) => void;
}

// Hook返回类型
export interface UseText2VideoReturn extends UseText2VideoState, UseText2VideoActions {}

export const useText2Video = (config: Text2VideoConfig = {}): UseText2VideoReturn => {
  const [service] = useState(() => new Text2VideoService(config));
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.IDLE);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Text2VideoResult | null>(null);
  const [availableModels] = useState(() => getAllAIModels());
  const [selectedModel, setSelectedModel] = useState('deepseek');

  const generateVideo = useCallback(async (text: string, templateId?: string, modelId?: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(GenerationStep.IDLE);
    setProgressMessage('');

    const callbacks: ProgressCallback = {
      onStepChange: (step) => setCurrentStep(step),
      onProgress: (message) => setProgressMessage(message),
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsLoading(false);
      },
      onComplete: (generationResult) => {
        setResult(generationResult);
        setIsLoading(false);
      }
    };

    try {
      await service.generateVideo(text, { templateId, modelId }, callbacks);
    } catch (err) {
      // 错误已经通过callbacks处理
      console.error('Video generation failed:', err);
    }
  }, [service]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setCurrentStep(GenerationStep.IDLE);
    setProgressMessage('');
    setError(null);
    setResult(null);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<Text2VideoConfig>) => {
    service.updateConfig(newConfig);
  }, [service]);

  return {
    isLoading,
    currentStep,
    progressMessage,
    error,
    result,
    availableModels,
    selectedModel,
    generateVideo,
    reset,
    updateConfig,
    setSelectedModel
  };
};
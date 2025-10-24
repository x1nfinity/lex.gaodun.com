/**
 * 提示词配置文件
 * 简单维护视频脚本生成的提示词
 */

// 默认的英语单词记忆故事生成提示词
export const DEFAULT_PROMPT = `你是一个创意记忆专家，专门为英语单词创建中文谐音记忆故事。

单词：{word}

创作要求：
1. 谐音要贴近中文发音，自然流畅，形象有趣
2. 故事要简短有趣，10秒能够讲述完
3. 必须把单词的意思巧妙地融入故事中
4. 内容要积极健康，避免不雅联想
5. 适合制作成短视频，有画面感

输出格式：
{
  "mnemonic_phrase": "谐音短语",
  "story_script": "完整的故事脚本，包含画面描述",
  "voiceover_text": "配音文本",
  "key_frames": ["关键画面1", "关键画面2"],
  "duration_estimate": 10
}`;

// AI模型配置
export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  apiUrl: string;
  maxTokens?: number;
  temperature?: number;
  headers?: Record<string, string>;
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    maxTokens: 1000,
    temperature: 0.7
  },
  {
    id: 'doubao',
    name: '豆包 (Doubao)',
    provider: 'doubao',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    maxTokens: 1000,
    temperature: 0.7
  },
  {
    id: 'qwen',
    name: '通义千问',
    provider: 'qwen',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    maxTokens: 1000,
    temperature: 0.7
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 1000,
    temperature: 0.7
  }
];

// 默认配置
export const DEFAULT_CONFIG = {
  defaultAIModel: 'deepseek',
  maxRetries: 3,
  timeout: 30000
};

// 渲染提示词（替换变量）
export function renderPrompt(word: string): string {
  return DEFAULT_PROMPT.replace('{word}', word);
}

// 获取AI模型配置
export function getAIModel(id: string): AIModelConfig | undefined {
  return AI_MODELS.find(model => model.id === id);
}

// 获取所有AI模型
export function getAllAIModels(): AIModelConfig[] {
  return AI_MODELS;
}
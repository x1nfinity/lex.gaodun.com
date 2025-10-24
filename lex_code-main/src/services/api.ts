import axios from 'axios';
import { getAIModel, renderPrompt, DEFAULT_CONFIG, AIModelConfig } from '../config/prompts';
import { generateVideoScript } from './aiService';

// 定义接口类型
export interface ScriptResponse {
    mnemonic_phrase: string;
    story_script: string;
    voiceover_text: string;
    key_frames: string[];
    duration_estimate: number;
}

export interface VideoResponse {
    output?: {
        task_id: string;
        task_status: string;
    };
    request_id: string;
}

export interface VideoStatusResponse {
    output?: {
        task_id: string;
        task_status: string;
        submit_time?: string;
        scheduled_time?: string;
        end_time?: string;
        orig_prompt?: string;
        video_url?: string;
        actual_prompt?: string;
        results?: Array<{
            url: string;
        }>;
    };
    request_id: string;
    usage?: {
        video_duration: number;
        video_ratio: string;
        video_count: number;
    };
}

export interface GenerateScriptOptions {
    word: string;
    aiModelId?: string;
    apiKey?: string;
}

// 生成脚本 - 支持多模型
export const generateScript = async (options: GenerateScriptOptions): Promise<ScriptResponse> => {
    const { word, aiModelId = DEFAULT_CONFIG.defaultAIModel, apiKey } = options;

    // 获取AI模型配置
    const model = getAIModel(aiModelId);
    if (!model) {
        throw new Error(`未找到AI模型配置: ${aiModelId}`);
    }

    // 渲染提示词
    const prompt = renderPrompt(word);

    // 获取API密钥
    const finalApiKey = apiKey || getApiKeyForModel(aiModelId);
    if (!finalApiKey) {
        throw new Error(`未配置${model.name}的API密钥`);
    }

    console.log('🎬 生成视频脚本:', {
        word,
        model: model.name,
        prompt: prompt.substring(0, 100) + '...',
    });

    try {
        // 调用AI服务生成脚本
        const scriptContent = await generateVideoScript(prompt, model, finalApiKey);

        // 解析生成的内容为结构化数据
        const parsedScript = parseScriptContent(scriptContent, word);

        console.log('✅ 脚本生成成功:', {
            word,
            model: model.name,
            scriptLength: scriptContent.length,
        });

        return parsedScript;
    } catch (error) {
        console.error('❌ 脚本生成失败:', {
            word,
            model: model.name,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};

/**
 * 根据模型ID获取对应的API密钥
 */
function getApiKeyForModel(modelId: string): string | undefined {
    switch (modelId) {
        case 'deepseek':
            return process.env.REACT_APP_DEEPSEEK_TOKEN;
        case 'doubao':
            return process.env.REACT_APP_DOUBAO_TOKEN;
        case 'qwen':
            return process.env.REACT_APP_QWEN_TOKEN;
        case 'chatgpt':
            return process.env.REACT_APP_OPENAI_TOKEN;
        default:
            return undefined;
    }
}

/**
 * 解析AI生成的内容为结构化脚本数据
 */
function parseScriptContent(content: string, word: string): ScriptResponse {
    // 尝试解析JSON格式的响应
    try {
        const parsed = JSON.parse(content);
        if (parsed.story_script || parsed.voiceover_text) {
            return {
                mnemonic_phrase: parsed.mnemonic_phrase || `${word}的记忆方法`,
                story_script: parsed.story_script || content,
                voiceover_text: parsed.voiceover_text || content,
                key_frames: parsed.key_frames || [content],
                duration_estimate: parsed.duration_estimate || 10,
            };
        }
    } catch (e) {
        // 如果不是JSON格式，继续处理
    }

    // 处理纯文本响应
    return {
        mnemonic_phrase: `${word}的视频脚本`,
        story_script: content,
        voiceover_text: content,
        key_frames: [content],
        duration_estimate: 10,
    };
}

// 阿里云视频生成API
export const generateVideo = async (scriptData: ScriptResponse): Promise<VideoResponse> => {
    const requestUrl = 'https://dashscope.aliyuncs.com/api/aliyun/api/v1/services/aigc/video-generation/video-synthesis';

    // 构建更丰富的提示词，包含所有脚本信息
    const enhancedPrompt = `
故事脚本: ${scriptData.story_script}

配音文本: ${scriptData.voiceover_text}

关键画面: ${scriptData.key_frames.join(', ')}

谐音记忆: ${scriptData.mnemonic_phrase}
  `.trim();

    const requestData = {
        model: 'wan2.5-t2v-preview',
        input: {
            prompt: enhancedPrompt,
        },
        parameters: {
            size: '832*480',
            duration: scriptData.duration_estimate || 5,
        },
    };
    const requestHeaders = {
        Authorization: `Bearer ${process.env.REACT_APP_ALIYUN_TOKEN}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
    };

    console.log('🎬 生成视频 - 请求参数:');
    console.log('URL:', requestUrl);
    console.log('Script Data:', scriptData);
    console.log('Enhanced Prompt:', enhancedPrompt);
    console.log('Request Data:', JSON.stringify(requestData, null, 2));
    console.log('Headers:', {
        Authorization: `Bearer ${process.env.REACT_APP_ALIYUN_TOKEN ? '***已配置***' : '未配置'}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
    });

    try {
        const response = await axios.post(requestUrl, requestData, {
            headers: requestHeaders,
        });

        console.log('✅ 视频生成请求成功 - 返回结果:');
        console.log('Status Code:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error: any) {
        console.error('❌ 视频生成失败:');
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.error?.message || error.response?.statusText;
            console.error(`API错误 ${status}: ${message}`);
            console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
            throw new Error(`视频生成失败 (${status}): ${message}`);
        } else if (error.request) {
            console.error('网络请求失败:', error.request);
            throw new Error('网络连接失败，请检查网络设置');
        } else {
            console.error('未知错误:', error.message);
            throw new Error(`视频生成失败: ${error.message}`);
        }
    }
};

// 查询视频生成状态
export const checkVideoStatus = async (taskId: string): Promise<VideoStatusResponse> => {
    const requestUrl = `https://dashscope.aliyuncs.com/api/aliyun/api/v1/tasks/${taskId}`;
    const requestHeaders = {
        Authorization: `Bearer ${process.env.REACT_APP_ALIYUN_TOKEN}`,
        'Content-Type': 'application/json',
    };

    console.log('🔍 查询视频生成状态 - 请求参数:');
    console.log('URL:', requestUrl);
    console.log('Task ID:', taskId);
    console.log('Headers:', {
        Authorization: `Bearer ${process.env.REACT_APP_ALIYUN_TOKEN ? '***已配置***' : '未配置'}`,
        'Content-Type': 'application/json',
    });

    try {
        const response = await axios.get(requestUrl, {
            headers: requestHeaders,
        });

        console.log('✅ 查询视频状态成功 - 返回结果:');
        console.log('Status Code:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error: any) {
        console.error('❌ 查询视频状态失败:');
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.error?.message || error.response?.statusText;
            console.error(`API错误 ${status}: ${message}`);
            console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
            throw new Error(`查询视频状态失败 (${status}): ${message}`);
        } else if (error.request) {
            console.error('网络请求失败:', error.request);
            throw new Error('网络连接失败，请检查网络设置');
        } else {
            console.error('未知错误:', error.message);
            throw new Error(`查询视频状态失败: ${error.message}`);
        }
    }
};

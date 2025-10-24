/**
 * 通用AI服务
 * 支持多个AI模型提供商
 */

import { AIModelConfig } from '../config/prompts';

export interface AIResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface AIRequestOptions {
    model: AIModelConfig;
    prompt: string;
    apiKey: string;
    maxTokens?: number;
    temperature?: number;
}

/**
 * DeepSeek API调用
 */
async function callDeepSeekAPI(options: AIRequestOptions): Promise<AIResponse> {
    const { model, prompt, apiKey, maxTokens, temperature } = options;

    console.log('🤖 调用DeepSeek API:', {
        url: model.apiUrl,
        prompt: prompt.substring(0, 100) + '...',
        maxTokens,
        temperature,
    });

    const response = await fetch(model.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...model.headers,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_tokens: maxTokens || model.maxTokens || 1000,
            temperature: temperature || model.temperature || 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ DeepSeek API错误:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
        });
        throw new Error(`DeepSeek API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ DeepSeek API响应:', {
        content: data.choices?.[0]?.message?.content?.substring(0, 100) + '...',
        usage: data.usage,
    });

    return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
    };
}

/**
 * 豆包(Doubao) API调用
 */
async function callDoubaoAPI(options: AIRequestOptions): Promise<AIResponse> {
    const { model, prompt, apiKey, maxTokens, temperature } = options;

    console.log('🤖 调用豆包API:', {
        url: model.apiUrl,
        prompt: prompt.substring(0, 100) + '...',
        maxTokens,
        temperature,
    });

    const response = await fetch(model.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...model.headers,
        },
        body: JSON.stringify({
            model: 'ep-20251015101857-wc8xz', // 豆包模型ID，可配置
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_tokens: maxTokens || model.maxTokens || 1000,
            temperature: temperature || model.temperature || 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ 豆包API错误:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
        });
        throw new Error(`豆包API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 豆包API响应:', {
        content: data.choices?.[0]?.message?.content?.substring(0, 100) + '...',
        usage: data.usage,
    });

    return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
    };
}

/**
 * 通义千问 API调用
 */
async function callQwenAPI(options: AIRequestOptions): Promise<AIResponse> {
    const { model, prompt, apiKey, maxTokens, temperature } = options;

    console.log('🤖 调用通义千问API:', {
        url: model.apiUrl,
        prompt: prompt.substring(0, 100) + '...',
        maxTokens,
        temperature,
    });

    const response = await fetch(model.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'X-DashScope-SSE': 'disable',
            ...model.headers,
        },
        body: JSON.stringify({
            model: 'qwen-turbo',
            input: {
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            },
            parameters: {
                max_tokens: maxTokens || model.maxTokens || 1000,
                temperature: temperature || model.temperature || 0.7,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ 通义千问API错误:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
        });
        throw new Error(`通义千问API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 通义千问API响应:', {
        content: data.output?.text?.substring(0, 100) + '...',
        usage: data.usage,
    });

    return {
        content: data.output?.text || '',
        usage: data.usage,
    };
}

/**
 * ChatGPT API调用
 */
async function callChatGPTAPI(options: AIRequestOptions): Promise<AIResponse> {
    const { model, prompt, apiKey, maxTokens, temperature } = options;

    console.log('🤖 调用ChatGPT API:', {
        url: model.apiUrl,
        prompt: prompt.substring(0, 100) + '...',
        maxTokens,
        temperature,
    });

    const response = await fetch(model.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...model.headers,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_tokens: maxTokens || model.maxTokens || 1000,
            temperature: temperature || model.temperature || 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ ChatGPT API错误:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
        });
        throw new Error(`ChatGPT API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ ChatGPT API响应:', {
        content: data.choices?.[0]?.message?.content?.substring(0, 100) + '...',
        usage: data.usage,
    });

    return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
    };
}

/**
 * 通用AI服务调用
 */
export async function callAIService(options: AIRequestOptions): Promise<AIResponse> {
    const { model } = options;

    try {
        switch (model.provider) {
            case 'deepseek':
                return await callDeepSeekAPI(options);
            case 'doubao':
                return await callDoubaoAPI(options);
            case 'qwen':
                return await callQwenAPI(options);
            case 'openai':
                return await callChatGPTAPI(options);
            default:
                throw new Error(`不支持的AI模型提供商: ${model.provider}`);
        }
    } catch (error) {
        console.error('❌ AI服务调用失败:', error);
        throw error;
    }
}

/**
 * 生成视频脚本
 */
export async function generateVideoScript(prompt: string, model: AIModelConfig, apiKey: string): Promise<string> {
    const response = await callAIService({
        model,
        prompt,
        apiKey,
    });

    return response.content;
}

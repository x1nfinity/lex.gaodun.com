import { generateScript, generateVideo, checkVideoStatus } from './api';
import type { ScriptResponse, VideoResponse, VideoStatusResponse, GenerateScriptOptions } from './api';

// 生成步骤枚举
export enum GenerationStep {
    IDLE = 'idle',
    GENERATING_SCRIPT = 'generating_script',
    SCRIPT_GENERATED = 'script_generated',
    GENERATING_VIDEO = 'generating_video',
    POLLING_VIDEO = 'polling_video',
    COMPLETED = 'completed',
    ERROR = 'error',
}

// 生成结果接口
export interface Text2VideoResult {
    script?: ScriptResponse;
    video?: VideoResponse;
    videoUrl?: string;
    error?: string;
}

// 生成配置接口
export interface Text2VideoConfig {
    maxPollingAttempts?: number;
    pollingInterval?: number;
}

// 进度回调接口
export interface ProgressCallback {
    onStepChange?: (step: GenerationStep) => void;
    onProgress?: (message: string) => void;
    onError?: (error: string) => void;
    onComplete?: (result: Text2VideoResult) => void;
}

/**
 * 文本转视频服务类
 * 封装完整的文本到视频生成流程
 */
export class Text2VideoService {
    private config: Required<Text2VideoConfig>;

    constructor(config: Text2VideoConfig = {}) {
        this.config = {
            maxPollingAttempts: config.maxPollingAttempts ?? 20,
            pollingInterval: config.pollingInterval ?? 15000,
        };
    }

    /**
     * 执行完整的文本转视频流程
     * @param text 输入文本
     * @param options 生成选项
     * @param callbacks 进度回调
     * @returns 生成结果
     */
    async generateVideo(
        text: string,
        options?: { templateId?: string; modelId?: string },
        callbacks?: ProgressCallback
    ): Promise<Text2VideoResult> {
        const result: Text2VideoResult = {};

        try {
            // 步骤1: 生成脚本
            callbacks?.onStepChange?.(GenerationStep.GENERATING_SCRIPT);
            callbacks?.onProgress?.('正在生成视频...');

            const script = await generateScript({
                word: text,
                aiModelId: options?.modelId,
            });
            result.script = script;

            callbacks?.onStepChange?.(GenerationStep.SCRIPT_GENERATED);
            callbacks?.onProgress?.('开始生成视频...');

            // 步骤2: 生成视频
            callbacks?.onStepChange?.(GenerationStep.GENERATING_VIDEO);
            callbacks?.onProgress?.('开始生成视频...');

            const videoResponse = await generateVideo(script);
            result.video = videoResponse;

            // 检查视频响应是否包含task_id
            if (!videoResponse.output?.task_id) {
                throw new Error('视频生成任务创建失败');
            }

            // 步骤3: 轮询视频状态
            callbacks?.onStepChange?.(GenerationStep.POLLING_VIDEO);
            callbacks?.onProgress?.('视频生成中，请稍候...');

            const videoUrl = await this.pollVideoStatus(videoResponse.output.task_id, callbacks);
            result.videoUrl = videoUrl;

            callbacks?.onStepChange?.(GenerationStep.COMPLETED);
            callbacks?.onProgress?.('视频生成完成！');
            callbacks?.onComplete?.(result);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            result.error = errorMessage;

            callbacks?.onStepChange?.(GenerationStep.ERROR);
            callbacks?.onError?.(errorMessage);

            throw error;
        }
    }

    /**
     * 轮询视频生成状态
     * @param taskId 任务ID
     * @param callbacks 进度回调
     * @returns 视频URL
     */
    private async pollVideoStatus(taskId: string, callbacks?: ProgressCallback): Promise<string> {
        let attempts = 0;

        while (attempts < this.config.maxPollingAttempts) {
            try {
                const status = await checkVideoStatus(taskId);

                // 详细日志记录API响应
                console.log(`[轮询状态] 第${attempts + 1}次尝试:`, {
                    taskId,
                    task_status: status.output?.task_status,
                    results: status.output?.results,
                    fullResponse: status,
                });

                // 检查任务状态
                if (status.output?.task_status === 'SUCCEEDED') {
                    // 成功状态的处理 - 优先检查video_url字段（阿里百炼的标准格式）
                    if (status.output.video_url) {
                        console.log('[轮询状态] 视频生成成功，获得URL:', status.output.video_url);
                        return status.output.video_url;
                    } else if (status.output.results?.[0]?.url) {
                        // 备用：检查results数组中的url
                        console.log('[轮询状态] 从results数组获得URL:', status.output.results[0].url);
                        return status.output.results[0].url;
                    } else {
                        // 成功但没有URL的情况
                        console.warn('[轮询状态] 任务状态为SUCCEEDED但缺少视频URL:', status.output);

                        // 检查是否有其他可能的URL字段
                        const outputAny = status.output as any;
                        const possibleUrl = outputAny?.url || outputAny?.download_url || outputAny?.file_url;

                        if (possibleUrl) {
                            console.log('[轮询状态] 找到替代URL字段:', possibleUrl);
                            return possibleUrl;
                        }

                        // 如果真的没有URL，抛出具体错误
                        throw new Error(`视频生成完成但无法获取视频URL。API响应: ${JSON.stringify(status.output)}`);
                    }
                } else if (status.output?.task_status === 'FAILED') {
                    console.error('[轮询状态] 视频生成失败:', status.output);
                    const outputAny = status.output as any;
                    throw new Error(`视频生成失败: ${outputAny?.error_message || '未知错误'}`);
                } else if (status.output?.task_status === 'RUNNING' || status.output?.task_status === 'PENDING') {
                    // 任务仍在进行中
                    console.log(`[轮询状态] 任务进行中，状态: ${status.output.task_status}`);
                } else {
                    // 未知状态
                    console.warn('[轮询状态] 未知任务状态:', status.output?.task_status);
                }

                // 更新进度信息
                const remainingTime = Math.ceil(((this.config.maxPollingAttempts - attempts) * this.config.pollingInterval) / 1000);
                // const statusText = status.output?.task_status || '未知';
                callbacks?.onProgress?.(`视频生成中... (预计还需 ${remainingTime} 秒)`);

                // 等待下次轮询
                await this.sleep(this.config.pollingInterval);
                attempts++;
            } catch (error) {
                console.error(`[轮询状态] 第${attempts + 1}次尝试失败:`, error);

                if (attempts === this.config.maxPollingAttempts - 1) {
                    throw new Error(`视频生成超时，请稍后重试。最后错误: ${error instanceof Error ? error.message : '未知错误'}`);
                }
                attempts++;
                await this.sleep(this.config.pollingInterval);
            }
        }

        throw new Error('视频生成超时，请稍后重试');
    }

    /**
     * 睡眠函数
     * @param ms 毫秒数
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 更新配置
     * @param config 新配置
     */
    updateConfig(config: Partial<Text2VideoConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// 导出默认实例
export const text2VideoService = new Text2VideoService();

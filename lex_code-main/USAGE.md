# 文本转视频功能使用指南

本项目提供了独立的文本转视频生成功能，支持多种AI模型和可配置的提示词模板，可以轻松集成到其他项目中。

## 核心组件

### 1. Text2VideoService 服务类

独立的文本转视频逻辑服务类，封装了完整的生成流程。

```typescript
import { Text2VideoService } from './services/text2video';

// 创建服务实例
const service = new Text2VideoService({
  pollingInterval: 15000,        // 轮询间隔（毫秒）
  maxPollingAttempts: 20,        // 最大轮询次数
});

// 生成视频
async function generateVideo(word: string) {
  try {
    const result = await service.generateVideo(word);
    console.log('生成成功:', result);
    return result;
  } catch (error) {
    console.error('生成失败:', error);
  }
}
```

### 2. useText2Video Hook

React Hook，提供状态管理和UI集成，支持模板和模型选择。

```typescript
import { useText2Video } from './hooks/useText2Video';

function MyComponent() {
  const {
    isLoading,
    currentStep,
    progressMessage,
    error,
    result,
    availableTemplates,
    availableModels,
    selectedTemplate,
    selectedModel,
    generateVideo,
    reset,
    setSelectedTemplate,
    setSelectedModel
  } = useText2Video({
    pollingInterval: 15000,
    maxPollingAttempts: 20
  });

  const handleGenerate = async () => {
    // 使用选定的模板和模型生成视频
    await generateVideo('apple', selectedTemplate, selectedModel);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  return (
    <div>
      {/* 模板选择 */}
      <div>
        <label>选择提示词模板:</label>
        <select value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
          {availableTemplates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* 模型选择 */}
      <div>
        <label>选择AI模型:</label>
        <select value={selectedModel} onChange={(e) => handleModelChange(e.target.value)}>
          {availableModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? '生成中...' : '生成视频'}
      </button>
      
      {isLoading && <p>{progressMessage}</p>}
      {error && <p>错误: {error}</p>}
      {result && (
        <div>
          <h3>脚本信息:</h3>
          <p>{result.script.story_script}</p>
          {result.videoUrl && (
            <video src={result.videoUrl} controls />
          )}
        </div>
      )}
    </div>
  );
}
```

## 类型定义

### GenerationStep
```typescript
type GenerationStep = 'idle' | 'generating_script' | 'generating_video' | 'polling_status' | 'completed' | 'error';
```

### Text2VideoResult
```typescript
interface Text2VideoResult {
  script: ScriptResponse;
  videoUrl?: string;
}
```

### Text2VideoConfig
```typescript
interface Text2VideoConfig {
  pollingInterval?: number;        // 轮询间隔，默认15秒
  maxPollingAttempts?: number;     // 最大轮询次数，默认20次
}
```

## 集成到现有项目

### 1. 复制核心文件

将以下文件复制到你的项目中：
- `src/services/text2video.ts` - 核心服务类
- `src/services/api.ts` - API接口
- `src/hooks/useText2Video.ts` - React Hook（如果使用React）

### 2. 安装依赖

确保项目中安装了必要的依赖：
```bash
npm install axios  # 用于HTTP请求
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件，配置API密钥：
```env
# 阿里云通义万象（视频生成，必需）
REACT_APP_ALIYUN_TOKEN=your_aliyun_token

# AI模型API密钥（至少配置一个）
REACT_APP_DEEPSEEK_TOKEN=your_deepseek_token
REACT_APP_DOUBAO_TOKEN=your_doubao_token
REACT_APP_QWEN_TOKEN=your_qwen_token
REACT_APP_OPENAI_TOKEN=your_openai_token
```

### 4. 配置提示词模板

复制 `src/config/prompts.ts` 文件，可以自定义提示词模板：
```typescript
import { PromptTemplate, AIModelConfig } from './config/prompts';

// 添加自定义模板
const customTemplate: PromptTemplate = {
  id: 'custom_template',
  name: '自定义模板',
  description: '我的自定义提示词模板',
  template: '请为单词 {word} 创建一个...',
  variables: ['word']
};
```

### 5. 使用示例

#### 纯JavaScript/TypeScript项目
```typescript
import { Text2VideoService } from './services/text2video';
import { generateVideoScript } from './services/aiService';

const service = new Text2VideoService({
  onProgress: (step, message) => {
    document.getElementById('status').textContent = message;
  }
});

document.getElementById('generateBtn').addEventListener('click', async () => {
  const word = document.getElementById('wordInput').value;
  const templateId = document.getElementById('templateSelect').value;
  const modelId = document.getElementById('modelSelect').value;
  
  // 使用指定模板和模型生成脚本
  const script = await generateVideoScript(word, templateId, modelId);
  
  // 生成视频
  const result = await service.generateVideo(word);
  // 处理结果
});
```

#### React项目
```typescript
import { useText2Video } from './hooks/useText2Video';

function VideoGenerator() {
  const { generateVideo, isLoading, result, error } = useText2Video();
  
  return (
    <div>
      <input id="wordInput" type="text" />
      <button onClick={() => generateVideo(document.getElementById('wordInput').value)}>
        生成视频
      </button>
      {/* 显示状态和结果 */}
    </div>
  );
}
```

#### Vue项目
```typescript
import { ref } from 'vue';
import { Text2VideoService } from './services/text2video';

export default {
  setup() {
    const isLoading = ref(false);
    const result = ref(null);
    const error = ref(null);
    
    const service = new Text2VideoService({
      onProgress: (step, message) => {
        // 更新进度
      },
      onError: (err) => {
        error.value = err;
      }
    });
    
    const generateVideo = async (word) => {
      isLoading.value = true;
      try {
        result.value = await service.generateVideo(word);
      } catch (err) {
        error.value = err.message;
      } finally {
        isLoading.value = false;
      }
    };
    
    return { generateVideo, isLoading, result, error };
  }
};
```

## 自定义配置

### 调整轮询参数
```typescript
const service = new Text2VideoService({
  pollingInterval: 10000,        // 10秒轮询一次
  maxPollingAttempts: 30,        // 最多轮询30次
});
```

### 自定义进度回调
```typescript
const service = new Text2VideoService({
  onProgress: (step, message) => {
    console.log(`当前步骤: ${step}, 消息: ${message}`);
  },
  onError: (error) => {
    console.error('生成失败:', error);
  },
  onComplete: (result) => {
    console.log('生成完成:', result);
  }
});
```

## 配置化功能详解

### 提示词模板系统

项目支持灵活的提示词模板配置，允许为不同场景定制AI生成内容。

#### 内置模板类型
- **基础脚本** (`video_script_basic`): 标准的视频脚本生成
- **创意故事** (`video_script_creative`): 富有创意的故事情节
- **教育内容** (`video_script_educational`): 教育导向的内容
- **幽默风格** (`video_script_humorous`): 轻松幽默的风格

#### 自定义模板
```typescript
// 在 src/config/prompts.ts 中添加
export const customPromptTemplates: PromptTemplate[] = [
  {
    id: 'business_presentation',
    name: '商务演示',
    description: '适用于商务场景的专业演示脚本',
    template: `请为单词 "{word}" 创建一个商务演示脚本，要求：
1. 专业正式的语调
2. 包含实际应用场景
3. 突出商业价值
4. 控制在60秒内`,
    variables: ['word']
  }
];
```

### AI模型配置

支持多种主流AI模型，每个模型都有独特的特点：

#### 模型特点对比
- **DeepSeek**: 中文内容生成质量高，理解能力强
- **豆包(Doubao)**: 字节跳动出品，创意内容生成优秀
- **通义千问**: 阿里云模型，逻辑性强，适合教育内容
- **ChatGPT**: OpenAI模型，通用性强，多语言支持好

#### 自定义模型配置
```typescript
// 在 src/config/prompts.ts 中添加
export const customAIModels: AIModelConfig[] = [
  {
    id: 'custom_model',
    name: '自定义模型',
    provider: 'custom',
    apiEndpoint: 'https://api.custom-ai.com/v1/chat',
    description: '我的自定义AI模型',
    maxTokens: 2000,
    temperature: 0.7
  }
];
```

### 环境变量配置

#### 必需配置
```env
# 阿里云通义万象 - 视频生成服务
REACT_APP_ALIYUN_TOKEN=your_aliyun_token
```

#### 可选配置（至少配置一个AI模型）
```env
# DeepSeek API
REACT_APP_DEEPSEEK_TOKEN=your_deepseek_token

# 豆包 API
REACT_APP_DOUBAO_TOKEN=your_doubao_token

# 通义千问 API  
REACT_APP_QWEN_TOKEN=your_qwen_token

# OpenAI API
REACT_APP_OPENAI_TOKEN=your_openai_token
```

### 高级配置选项

#### 视频生成参数
```typescript
const videoConfig = {
  pollingInterval: 15000,      // 状态轮询间隔
  maxPollingAttempts: 20,      // 最大轮询次数
  videoLength: 60,             // 视频长度（秒）
  videoQuality: 'high',        // 视频质量
  aspectRatio: '16:9'          // 视频比例
};
```

#### API请求配置
```typescript
const apiConfig = {
  timeout: 30000,              // 请求超时时间
  retryAttempts: 3,            // 重试次数
  retryDelay: 1000            // 重试延迟
};

// 使用回调参数
const result = await service.generateVideo(word, {
  onStepChange: (step) => {
    // 自定义进度显示逻辑
    switch(step) {
      case GenerationStep.GENERATING_SCRIPT:
        showProgress('正在生成脚本...', 25);
        break;
      case GenerationStep.GENERATING_VIDEO:
        showProgress('正在生成视频...', 50);
        break;
      case GenerationStep.POLLING_VIDEO:
        showProgress('正在处理视频...', 75);
        break;
      case GenerationStep.COMPLETED:
        showProgress('生成完成！', 100);
        break;
    }
  },
  onProgress: (message) => {
    console.log('进度信息:', message);
  },
  onError: (error) => {
    console.error('生成错误:', error);
  }
});
```

## 错误处理

```typescript
try {
  const result = await service.generateVideo(word);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('生成超时，请稍后重试');
  } else if (error.message.includes('network')) {
    console.log('网络错误，请检查连接');
  } else {
    console.log('生成失败:', error.message);
  }
}
```

## 注意事项

1. **API配置**: 确保正确配置API端点和认证信息
2. **轮询间隔**: 建议使用15秒间隔，符合通义万相官方建议
3. **错误处理**: 实现适当的错误处理和用户反馈
4. **资源清理**: 在组件卸载时清理正在进行的请求
5. **网络优化**: 考虑实现请求重试和网络状态检测
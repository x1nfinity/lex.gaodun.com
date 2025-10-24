# 单词转视频生成器

基于React+TypeScript实现的智能单词记忆视频生成工具，支持多种AI模型和可配置的提示词模板。

## 功能特点

- 🎯 输入英语单词，自动生成中文谐音记忆故事
- 🤖 支持多种AI模型：DeepSeek、豆包(Doubao)、通义千问、ChatGPT
- 📝 可配置的提示词模板，支持不同类型的视频脚本生成
- 🎬 使用阿里云通义万象生成高质量短视频
- 🎨 简洁现代的用户界面
- ⚙️ 灵活的配置系统，支持自定义模型和模板

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
在`.env`文件中配置所需的API密钥：
```env
# 阿里云通义万象（视频生成，必需）
REACT_APP_ALIYUN_TOKEN=your_aliyun_token

# AI模型API密钥（至少配置一个）
REACT_APP_DEEPSEEK_TOKEN=your_deepseek_token
REACT_APP_DOUBAO_TOKEN=your_doubao_token
REACT_APP_QWEN_TOKEN=your_qwen_token
REACT_APP_OPENAI_TOKEN=your_openai_token
```

3. 启动开发服务器：
```bash
npm start
```

4. 在浏览器中打开 http://localhost:3001

## 使用方法

### 基础使用
1. 在输入框中输入英语单词
2. 选择AI模型（DeepSeek、豆包、通义千问或ChatGPT）
3. 选择提示词模板（基础脚本、创意故事、教育内容等）
4. 点击"生成视频"按钮
5. 等待脚本生成和视频制作完成
6. 查看生成的记忆故事和视频

### 高级配置
- **提示词模板**：在 `src/config/prompts.ts` 中自定义提示词模板
- **AI模型配置**：支持配置不同模型的API端点和参数
- **视频参数**：可调整视频生成的各种参数

## 配置说明

### 提示词模板
系统内置多种提示词模板：
- `video_script_basic`: 基础视频脚本
- `video_script_creative`: 创意故事脚本
- `video_script_educational`: 教育内容脚本
- `video_script_humorous`: 幽默风格脚本

### AI模型支持
- **DeepSeek**: 高质量中文内容生成
- **豆包(Doubao)**: 字节跳动的AI模型
- **通义千问**: 阿里云的大语言模型
- **ChatGPT**: OpenAI的GPT模型

## 项目结构

```
src/
├── components/          # React组件
├── config/
│   └── prompts.ts      # 提示词配置
├── hooks/
│   └── useText2Video.ts # 主要业务逻辑Hook
├── services/
│   ├── aiService.ts    # AI模型服务
│   ├── api.ts          # API服务
│   └── text2video.ts   # 视频生成服务
├── App.tsx             # 主应用组件
└── index.tsx           # 应用入口
```

## 技术栈

- **前端框架**: React 18 + TypeScript
- **AI模型**: DeepSeek、豆包、通义千问、ChatGPT
- **视频生成**: 阿里云通义万象
- **状态管理**: React Hooks
- **构建工具**: Create React App
// 核心服务导出
export { 
  Text2VideoService, 
  text2VideoService,
  GenerationStep 
} from './services/text2video';
export type { 
  Text2VideoResult, 
  Text2VideoConfig, 
  ProgressCallback 
} from './services/text2video';

// Hook导出
export { useText2Video } from './hooks/useText2Video';
export type { 
  UseText2VideoState,
  UseText2VideoActions,
  UseText2VideoReturn 
} from './hooks/useText2Video';

// 底层API服务导出（供高级用户使用）
export { generateScript, generateVideo, checkVideoStatus } from './services/api';
export type { ScriptResponse, VideoResponse, VideoStatusResponse } from './services/api';
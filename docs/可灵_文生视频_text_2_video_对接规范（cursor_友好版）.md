# 可灵 · 文生视频（Text2Video）对接规范

> **用途**：本 Markdown 文档可直接在 Cursor/VSCode 打开，用于后端/脚手架快速对接与前端调试。包含接口说明、参数表、示例请求、OpenAPI 片段与 Prompt 编写规范。

---

## 目录
- [1. 基本信息](#1-基本信息)
- [2. 请求体](#2-请求体)
  - [2.1 根结构](#21-根结构)
  - [2.2 generateParams 参数定义](#22-generateparams-参数定义)
  - [2.3 示例请求](#23-示例请求)
- [3. 返回体](#3-返回体)
- [4. OpenAPI 3.0 片段](#4-openapi-30-片段)
- [5. 代码示例](#5-代码示例)
  - [5.1 cURL](#51-curl)
  - [5.2 JavaScript（fetch/Node）](#52-javascriptfetchnode)
  - [5.3 Python（requests）](#53-pythonrequests)
- [6. 任务追踪与结果获取（预留）](#6-任务追踪与结果获取预留)
- [7. 客户端校验与容错建议](#7-客户端校验与容错建议)
- [8. 提示词（Prompt）写法建议](#8-提示词prompt写法建议)
- [9. 最小可用示例](#9-最小可用示例)
- [10. 集成清单（DoD）](#10-集成清单dod)

---

## 1. 基本信息
- **HTTP 方法**：`POST`
- **URL**：`/api/generate/video/kling/text2video`
- **Headers**
  - `Content-Type: application/json`

---

## 2. 请求体

### 2.1 根结构
```jsonc
{
  "templateUuid": "string",          // 必填
  "generateParams": {                 // 必填
    // 见 2.2 参数定义；未在列表中的字段将原样透传给服务端
  }
}
```
- `templateUuid`（string，必填）：固定使用 `61cd8b60d340404394f2a545eeaf197a`
- `generateParams`（object，必填）：文生视频参数（JSON 对象）
  - 注意：如果包含图片字段，必须提供**可公网访问**的完整 URL

### 2.2 generateParams 参数定义

| 字段名 | 类型 | 必填 | 说明 | 取值/范围 | 备注 |
|---|---|---|---|---|---|
| `model` | enum | 否 | 可灵模型版本 | `kling-v1-6` \| `kling-v2-master` \| **`kling-v2-1-master`(默认)** | 未传则默认 `kling-v2-1-master` |
| `prompt` | string | **是** | 提示词（中英文均可） | 字符数 ≤ 2000 | 建议遵循下文“提示词写法” |
| `aspectRatio` | enum | 否 | 画面宽高比 | **`16:9`(默认)** \| `9:16` \| `1:1` | - |
| `duration` | string | 否 | 视频时长（秒） | **`5`(默认)** \| `10` | 仅支持 `"5"` 或 `"10"` |
| `promptMagic` | number/boolean | 否 | 提示词增强强度 | 推荐 `0/1` 或 `0~1` 小数 | **示例中出现**；按透传处理 |

> 说明：接口未显式限制 `generateParams` 的其他可选字段；若后续平台扩展参数，可直接透传。

### 2.3 示例请求
```json
{
  "templateUuid": "61cd8b60d340404394f2a545eeaf197a",
  "generateParams": {
    "model": "kling-v2-1-master",
    "prompt": "一个摇滚乐队的演出现场，主唱拿着麦克风在台上唱歌，吉他手在卖力弹吉他，贝斯手弹贝斯，鼓手在摇头晃脑地敲鼓，键盘手在弹钢琴。",
    "promptMagic": 1,
    "aspectRatio": "16:9",
    "duration": "5"
  }
}
```

---

## 3. 返回体

| 字段名 | 类型 | 说明 |
|---|---|---|
| `generateUuid` | string | 任务 UUID。**用于后续查询生成进度/结果** |

**示例响应**
```json
{
  "generateUuid": "2f6d9a10-3a0e-4f7e-a2f4-9f3d6b1b4c0e"
}
```

> 注：当前资料仅给出 `generateUuid`；查询进度/结果的接口路径与字段暂未提供，见 [§6](#6-任务追踪与结果获取预留)。

---

## 4. OpenAPI 3.0 片段
```yaml
openapi: 3.0.3
info:
  title: Kling Text2Video API
  version: 1.0.0
paths:
  /api/generate/video/kling/text2video:
    post:
      summary: Create a Kling text-to-video generation task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [templateUuid, generateParams]
              properties:
                templateUuid:
                  type: string
                  example: 61cd8b60d340404394f2a545eeaf197a
                generateParams:
                  type: object
                  required: [prompt]
                  properties:
                    model:
                      type: string
                      enum: [kling-v1-6, kling-v2-master, kling-v2-1-master]
                      default: kling-v2-1-master
                    prompt:
                      type: string
                      maxLength: 2000
                    aspectRatio:
                      type: string
                      enum: [16:9, 9:16, 1:1]
                      default: 16:9
                    duration:
                      type: string
                      enum: ["5", "10"]
                      default: "5"
                    promptMagic:
                      oneOf:
                        - type: number
                        - type: integer
                        - type: boolean
      responses:
        '200':
          description: Task created
          content:
            application/json:
              schema:
                type: object
                properties:
                  generateUuid:
                    type: string
```

---

## 5. 代码示例

### 5.1 cURL
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "templateUuid": "61cd8b60d340404394f2a545eeaf197a",
    "generateParams": {
      "model": "kling-v2-1-master",
      "prompt": "城市夜景下的无人机航拍，霓虹灯反射在湿润的道路上，车辆轨迹形成光带，镜头缓慢推进。",
      "aspectRatio": "16:9",
      "duration": "5",
      "promptMagic": 1
    }
  }' \
  https://<YOUR_HOST>/api/generate/video/kling/text2video
```

### 5.2 JavaScript（fetch/Node）
```js
async function createKlingTask(baseURL, body) {
  const res = await fetch(`${baseURL}/api/generate/video/kling/text2video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kling create task failed: ${res.status} ${text}`);
  }
  return res.json(); // { generateUuid }
}

const payload = {
  templateUuid: '61cd8b60d340404394f2a545eeaf197a',
  generateParams: {
    model: 'kling-v2-1-master',
    prompt: '近景拍摄一只橘猫趴在窗台上打盹，阳光透过纱帘形成柔和的光斑，微风轻拂猫须。',
    aspectRatio: '1:1',
    duration: '5',
    promptMagic: 1
  }
};

createKlingTask('https://<YOUR_HOST>', payload)
  .then(({ generateUuid }) => console.log('generateUuid:', generateUuid))
  .catch(console.error);
```

### 5.3 Python（requests）
```python
import requests

def create_kling_task(base_url: str, template_uuid: str, params: dict) -> str:
    url = f"{base_url}/api/generate/video/kling/text2video"
    payload = {"templateUuid": template_uuid, "generateParams": params}
    r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
    r.raise_for_status()
    data = r.json()
    return data["generateUuid"]

if __name__ == "__main__":
    generate_uuid = create_kling_task(
        "https://<YOUR_HOST>",
        "61cd8b60d340404394f2a545eeaf197a",
        {
            "prompt": "森林中清晨的薄雾，阳光穿过树梢形成体积光，远处有鹿缓慢走过，镜头轻微摇移。",
            "aspectRatio": "16:9",
            "duration": "10",
            "model": "kling-v2-1-master",
            "promptMagic": 0.8
        }
    )
    print("generateUuid:", generate_uuid)
```

---

## 5.4 TypeScript 类型与 API Client（前端）

> 适用于 React + TypeScript 项目，零依赖（可选集成 Zod 做结果校验）。

### 5.4.1 类型定义
```ts
// src/types/kling.ts
export type KlingModel = 'kling-v1-6' | 'kling-v2-master' | 'kling-v2-1-master';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface KlingGenerateParams {
  prompt: string;               // ≤ 2000 chars
  model?: KlingModel;           // default: 'kling-v2-1-master'
  aspectRatio?: AspectRatio;    // default: '16:9'
  duration?: '5' | '10';        // default: '5'
  // 未明确列出的字段允许透传，例如：promptMagic 等
  [extra: string]: unknown;
}

export interface KlingText2VideoRequest {
  templateUuid: string;               // 必填
  generateParams: KlingGenerateParams;// 必填
}

export interface KlingText2VideoResponse {
  generateUuid: string;
}
```

### 5.4.2 轻量 API Client（带超时 & 错误包装）
```ts
// src/api/klingClient.ts
export interface CreateTaskOptions {
  baseURL?: string;         // 默认从环境变量读取
  signal?: AbortSignal;     // 可选：用于取消
  timeoutMs?: number;       // 默认 30_000ms
}

export class KlingError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = 'KlingError';
  }
}

export async function createKlingTask(
  payload: import('../types/kling').KlingText2VideoRequest,
  opts: CreateTaskOptions = {}
): Promise<import('../types/kling').KlingText2VideoResponse> {
  const baseURL = opts.baseURL ?? import.meta.env.VITE_KLING_BASE_URL ?? process.env.NEXT_PUBLIC_KLING_BASE_URL;
  if (!baseURL) throw new KlingError('Missing baseURL: set VITE_KLING_BASE_URL or NEXT_PUBLIC_KLING_BASE_URL');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
  const signal = opts.signal ?? controller.signal;

  try {
    const res = await fetch(`${baseURL}/api/generate/video/kling/text2video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new KlingError(`Create task failed: ${res.status}`, res.status, text);
    }

    const data = (await res.json()) as import('../types/kling').KlingText2VideoResponse;
    if (!data?.generateUuid) {
      throw new KlingError('Invalid response: missing generateUuid', res.status, data);
    }
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new KlingError('Request aborted/timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
```

> **CORS 提示**：若前端直连网关，请确保服务端允许 `POST /api/generate/video/kling/text2video` 的跨域；推荐通过自有 BFF/代理转发以隐藏服务端口与鉴权细节。

### 5.4.3（可选）Zod 结果校验
```ts
// src/schemas/kling.ts
import { z } from 'zod';

export const KlingText2VideoResponseSchema = z.object({
  generateUuid: z.string().min(1),
});

export type KlingText2VideoResponse = z.infer<typeof KlingText2VideoResponseSchema>;
```

---

## 5.5 React Hook 封装
```ts
// src/hooks/useKlingText2Video.ts
import { useCallback, useMemo, useState } from 'react';
import type { KlingText2VideoRequest, KlingText2VideoResponse } from '../types/kling';
import { createKlingTask, KlingError } from '../api/klingClient';

export type UseKlingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: KlingText2VideoResponse }
  | { status: 'error'; error: KlingError };

export function useKlingText2Video(defaultTemplateUuid = '61cd8b60d340404394f2a545eeaf197a') {
  const [state, setState] = useState<UseKlingState>({ status: 'idle' });

  const create = useCallback(async (params: KlingText2VideoRequest['generateParams']) => {
    setState({ status: 'loading' });
    try {
      const payload: KlingText2VideoRequest = {
        templateUuid: defaultTemplateUuid,
        generateParams: params,
      };
      const data = await createKlingTask(payload);
      setState({ status: 'success', data });
      return data;
    } catch (e) {
      const err = e instanceof KlingError ? e : new KlingError((e as Error).message);
      setState({ status: 'error', error: err });
      throw err;
    }
  }, [defaultTemplateUuid]);

  return useMemo(() => ({ ...state, create }), [state, create]);
}
```

### 5.5.1 使用示例（Vite/Next.js 均可）
```tsx
// src/components/KlingForm.tsx
import { useState } from 'react';
import { useKlingText2Video } from '../hooks/useKlingText2Video';
import type { AspectRatio, KlingModel } from '../types/kling';

export default function KlingForm() {
  const { status, create, data, error } = useKlingText2Video();
  const [prompt, setPrompt] = useState('清晨城市高楼间的慢速航拍镜头…');
  const [model, setModel] = useState<KlingModel>('kling-v2-1-master');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<'5' | '10'>('5');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create({ prompt, model, aspectRatio, duration, promptMagic: 1 });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} placeholder="输入提示词（≤2000字符）" />

      <div style={{ display: 'flex', gap: 8 }}>
        <select value={model} onChange={e => setModel(e.target.value as KlingModel)}>
          <option value="kling-v1-6">kling-v1-6</option>
          <option value="kling-v2-master">kling-v2-master</option>
          <option value="kling-v2-1-master">kling-v2-1-master (默认)</option>
        </select>
        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)}>
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
        </select>
        <select value={duration} onChange={e => setDuration(e.target.value as '5' | '10')}>
          <option value="5">5s</option>
          <option value="10">10s</option>
        </select>
      </div>

      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? '创建中…' : '创建任务'}
      </button>

      {status === 'error' && <p style={{ color: 'crimson' }}>错误：{error.message}</p>}
      {status === 'success' && <p>任务已创建，UUID：<code>{data.generateUuid}</code></p>}
    </form>
  );
}
```

> UI 库版本（如 shadcn/ui）可将上例替换为组件化表单；业务逻辑不变。

---

## 5.6 环境配置与打包

- **环境变量**：
  - Vite：在 `.env` 中设置 `VITE_KLING_BASE_URL=https://<YOUR_HOST>`
  - Next.js：在 `.env.local` 中设置 `NEXT_PUBLIC_KLING_BASE_URL=https://<YOUR_HOST>`
- **类型路径**：确保 `baseUrl`/`paths` 正确或使用相对导入。
- **Node/浏览器**：该接口通常需要后端代理以避免泄露私密域名/鉴权；若直连，请配置 CORS。

---

## 5.7 前端校验清单（TS/React）
- [ ] `prompt` 非空且长度 ≤ 2000
- [ ] `aspectRatio` ∈ {`16:9`,`9:16`,`1:1`}
- [ ] `duration` ∈ {`'5'`,`'10'`}
- [ ] 未知字段允许透传（例如 `promptMagic`）
- [ ] 超时/取消（AbortController）处理就绪

---

## 6. 任务追踪与结果获取（预留）
> 目前仅返回 `generateUuid`。请在 SDK/调用侧预留以下能力，待查询接口可用后直接落地：

- 轮询：每 **2–5 秒** 查询一次任务状态（指数退避上限 10–15s）
- 状态机：`PENDING` → `RUNNING` → `SUCCEEDED | FAILED | CANCELED`
- 成功时：返回可下载视频地址/播放 URL、封面图、分辨率、时长等
- 失败时：包含错误码/错误信息，便于重试或降级

> 在 SDK 中抽象 `getTaskStatus(generateUuid)` 与 `getTaskResult(generateUuid)` 两个占位方法，当前先 `NotImplemented`，后续补齐。

---

## 7. 客户端校验与容错建议
1. **必填项校验**：`templateUuid` 非空；`generateParams.prompt` 非空且 ≤ 2000 字符
2. **枚举校验**：`model`、`aspectRatio`、`duration` 合法；缺省用默认值
3. **图片 URL 可达性**：如含参考图/初始帧，需公网直链（HTTP(S) 200）
4. **重试策略**：5xx/网络错误使用指数退避，最多 3 次；避免对 4xx 盲重试
5. **超时建议**：创建任务接口超时 30s
6. **幂等性（可选）**：若支持 `clientRequestId`，建议透传；否则对 `prompt+model+参数` 做去重 hash

---

## 8. 提示词（Prompt）写法建议

按 **场景 → 主体 → 动作/情绪 → 镜头语言 → 光影/质感 → 节奏/时长 → 画幅** 的顺序组织信息：

- **中文示例（叙事）**
  ```
  傍晚的海边木栈道，少女背对镜头慢慢走向落日，
  微风吹动长发和连衣裙下摆，情绪宁静，
  镜头从中景缓慢推近到近景，保持轻微手持感，
  光线呈金色侧逆光，色调温暖，画面颗粒细腻，
  时长5秒，16:9。
  ```

- **中文示例（产品演示）**
  ```
  桌面环境中，一台银色笔记本电脑自动开合，
  屏幕显示城市夜景延时画面，边缘氛围灯随画面律动，
  镜头固定正面，中性光，画面干净简约，色彩真实，
  时长10秒，1:1。
  ```

- **英文示例（动作场面）**
  ```
  A futuristic motorcycle dashes through a neon-lit rain-soaked street at night,
  rider leans into a sharp turn, water splashes and light streaks,
  dynamic tracking shot with slight motion blur,
  high contrast, glossy reflections, cinematic grading,
  duration 5 seconds, aspect ratio 9:16.
  ```

**推荐要点**
- 指定 **镜头运动**（推进/平移/跟拍/空镜）、**构图距离**（远景/全景/中景/近景/特写）
- 指定 **光照与风格**（体积光/逆光/低饱和/纪录片/电影级）
- 指定 **节奏/时长/画幅** 与是否 **稳定/手持感**
- 避免笼统词（如“好看”“高清”），尽量使用可视化、可操作的描述
- 复杂需求可多句/逗号分隔，保持结构清晰

---

## 9. 最小可用示例

**请求体**
```json
{
  "templateUuid": "61cd8b60d340404394f2a545eeaf197a",
  "generateParams": {
    "prompt": "清晨城市高楼间的慢速航拍镜头，阳光从楼宇间穿过形成体积光，镜头平稳推进至广场中心，行人稀疏，色调干净，时长5秒，16:9。",
    "aspectRatio": "16:9",
    "duration": "5"
  }
}
```

**预期响应**
```json
{
  "generateUuid": "<服务端返回的任务UUID>"
}
```

---

## 10. 集成清单（DoD）
- [ ] 封装 `createVideoTask(payload)`，入参本地校验（§7）
- [ ] 解析并返回 `generateUuid`
- [ ] 预留 `getTaskStatus(uuid)` / `getTaskResult(uuid)` 占位，接入后替换
- [ ] 错误处理与日志（包含请求/响应摘要、错误码、重试次数）
- [ ] 提供示例脚本与 README（含 cURL/JS/Python）
- [ ] （可选）建立 Prompt 片段库（场景模板化复用）


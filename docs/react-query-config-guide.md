# React Query 配置说明

## 📋 当前全局配置

**文件**: [`src/utils/queryClient.ts`](../src/utils/queryClient.ts)

```typescript
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0, // 无缓存，每次都获取最新数据
            gcTime: 5 * 60 * 1000, // 5分钟后清除缓存
            refetchOnWindowFocus: false, // 窗口聚焦时不刷新
            refetchOnReconnect: true, // 网络重连时刷新
            refetchOnMount: true, // 组件挂载时总是刷新
            retry: false, // 默认不重试
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
        },
        mutations: {
            retry: false, // 写操作不重试
        },
    },
});
```

---

## 🎯 设计理念

### 核心原则

**1. 数据实时性优先** - 默认无缓存

```typescript
staleTime: 0; // 每次都获取最新数据
```

**2. 短期防重复** - 5分钟内防止误操作

```typescript
gcTime: 5 * 60 * 1000; // 快速误操作时复用缓存
```

**3. 业务层可覆盖** - 特殊场景显式配置

```typescript
// 稳定数据可在业务层覆盖
useQuery({
    queryKey: ['course', 'detail', courseId],
    staleTime: 5 * 60 * 1000, // 覆盖全局配置
});
```

---

## 📊 配置参数详解

### staleTime - 数据新鲜度

**当前值**: `0`

**含义**: 数据何时被标记为"过期"

```typescript
// staleTime = 0（当前配置）
访问页面 → 发起请求 → 数据立即标记为过期
再次访问 → 检测到过期 → 重新请求 ✅

// staleTime = 5分钟（需业务层覆盖）
访问页面 → 发起请求 → 数据标记为新鲜
5分钟内 → 使用缓存 ✅
5分钟后 → 标记为过期 → 重新请求
```

**使用场景**:

- ✅ **全局默认 0** - 适用于实时数据（如学习进度、评估结果）
- ⚠️ **业务层覆盖** - 稳定数据可配置缓存（如课程详情、字典）

---

### gcTime - 缓存清除时间

**当前值**: `5 * 60 * 1000` (5分钟)

**含义**: 查询变为 inactive 后多久从内存中清除

```typescript
// 场景：用户快速误操作
点击科目 A (0秒) → 发起请求，数据缓存
误点科目 B (1秒) → 发起请求，A 变为 inactive
立即切回 A (2秒) → gcTime 内，复用缓存 ✅

// 场景：正常切换
点击科目 A (0秒) → 发起请求
查看数据 5 秒
点击科目 B (5秒) → 发起请求，A 变为 inactive
5分钟后 A 缓存清除 (305秒)
切回 A (10分钟) → 缓存已清除，重新请求 ✅
```

**为什么是 5 分钟？**

- ✅ 覆盖常见的页面浏览时长（3-5分钟）
- ✅ 防止快速误操作导致重复请求
- ✅ 避免长期占用内存

**业务层覆盖示例**:

```typescript
// 预测分页面：3秒防误操作（更贴近人手反应速度）
useQuery({
    queryKey: ['predictScore', 'assessment', ...],
    gcTime: 3 * 1000,  // 覆盖为 3 秒
});
```

---

### retry - 错误重试

**当前值**: `false`

**含义**: 请求失败时是否自动重试

```typescript
// retry = false（当前配置）
请求失败 → 立即返回错误 → 便于测试和调试

// retry = 1（可在业务层覆盖）
请求失败 → 等待 retryDelay → 重试 1 次 → 失败返回错误
```

**为什么默认不重试？**

- ✅ 避免增加测试复杂度
- ✅ 快速失败，便于问题定位
- ✅ 登录失效等场景不应重试

**业务层覆盖示例**:

```typescript
// 必需数据可配置重试
useQuery({
    queryKey: ['course', 'assign', courseId],
    retry: 1, // 失败重试 1 次
});
```

---

### refetchOnMount - 组件挂载时刷新

**当前值**: `true`

**含义**: 组件挂载时是否检查数据是否过期并刷新

```typescript
// refetchOnMount = true（当前配置）
组件挂载 → 检查数据是否过期（staleTime）
  ├─ 已过期（staleTime=0） → 重新请求 ✅
  └─ 未过期（staleTime>0） → 使用缓存

// 结合 staleTime=0 的效果
组件每次挂载都会重新请求数据（保证实时性）
```

---

### refetchOnWindowFocus - 窗口聚焦时刷新

**当前值**: `false`

**含义**: 用户切换回浏览器窗口时是否刷新数据

```typescript
// refetchOnWindowFocus = false（当前配置）
用户切换到其他窗口 → 不影响
切换回浏览器 → 不自动刷新

// 如果设为 true
用户切换回浏览器 → 自动检查过期 → 可能刷新数据
```

**为什么关闭？**

- ✅ 避免不必要的请求（用户可能只是查看其他内容）
- ✅ 减少服务器压力
- ✅ 已通过 `staleTime=0` + `refetchOnMount=true` 保证实时性

---

## 🔄 实际行为示例

### 场景 1: 预测分页面切换科目

**配置**:

```typescript
// 全局
staleTime: 0;
gcTime: 5 * 60 * 1000;

// 业务层覆盖
staleTime: 0;
gcTime: 3 * 1000;
```

**行为**:

```
用户点击科目 A (0秒)
  → 发起请求，缓存 3 秒

误点科目 B (1秒)
  → 发起请求，A 变为 inactive

立即切回 A (2秒)
  → 3秒内，复用缓存 ✅（避免重复请求）

正常切换 (10秒后)
  → 缓存已清除，重新请求 ✅（获取最新数据）
```

---

### 场景 2: 课程上下文跨路由访问

**配置**:

```typescript
// 使用全局默认
staleTime: 0;
gcTime: 5 * 60 * 1000;
```

**行为**:

```
访问 /course/123/syllabus
  → 请求课程详情，缓存 5 分钟

切换到 /course/123/resource (10秒后)
  → 组件挂载，检查缓存
  → staleTime=0，数据已过期
  → 重新请求 ✅（获取最新数据）

快速误操作：切换到 /course/123/plan (1秒内)
  → 5分钟内，复用缓存 ✅（防止重复请求）
```

**注意**: 虽然 `staleTime=0` 会导致每次都重新请求，但：

- ✅ 保证了数据实时性
- ✅ 5分钟 `gcTime` 仍能防止快速误操作

---

### 场景 3: 稳定数据缓存（业务层覆盖）

**配置**:

```typescript
// 课程详情（相对稳定）
useQuery({
    queryKey: ['course', 'detail', courseId],
    staleTime: 5 * 60 * 1000, // 覆盖全局
    gcTime: 10 * 60 * 1000, // 覆盖全局
});
```

**行为**:

```
访问 /course/123/syllabus
  → 请求课程详情，缓存 5 分钟

5分钟内切换到 /course/123/resource
  → 数据未过期，使用缓存 ✅（减少请求）

5分钟后切换
  → 数据已过期，重新请求 ✅
```

---

## 📋 使用指南

### 何时使用全局默认配置

**适用场景** (80%):

- ✅ 实时数据（学习进度、评估结果、考试记录）
- ✅ 用户操作触发的数据变更
- ✅ 需要保证最新的业务数据

**示例**:

```typescript
// 直接使用，无需额外配置
useQuery({
    queryKey: ['study', 'progress', userId],
    queryFn: getStudyProgress,
    // staleTime: 0（全局默认）
    // gcTime: 5分钟（全局默认）
});
```

---

### 何时覆盖配置

**场景 1: 稳定数据** - 配置缓存

```typescript
// 课程详情、字典数据等
useQuery({
    queryKey: ['course', 'detail', courseId],
    queryFn: getCourseDetail,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟清除
});
```

**场景 2: 快速误操作防护** - 调整 gcTime

```typescript
// 预测分页面（人手反应速度 < 3秒）
useQuery({
    queryKey: ['predictScore', 'assessment', ...],
    queryFn: fetchAssessment,
    staleTime: 0,        // 保持全局默认
    gcTime: 3 * 1000,    // 覆盖为 3 秒
});
```

**场景 3: 必需数据** - 配置重试

```typescript
// 派课信息（必须成功才能继续）
useQuery({
    queryKey: ['course', 'assign', courseId],
    queryFn: getCourseAssign,
    retry: 1, // 失败重试 1 次
});
```

**场景 4: 非必需数据** - 明确不重试

```typescript
// 引导信息（失败不影响核心功能）
useQuery({
    queryKey: ['course', 'guide', courseId],
    queryFn: getCourseGuideInfo,
    retry: false, // 失败不重试
});
```

---

## ⚠️ 常见误区

### ❌ 误区 1: 所有数据都配置缓存

```typescript
// ❌ 错误：默认给所有查询加缓存
useQuery({
    queryKey: ['study', 'progress', userId],
    staleTime: 5 * 60 * 1000, // 不需要！
});

// ✅ 正确：仅稳定数据配置缓存
useQuery({
    queryKey: ['study', 'progress', userId],
    // 使用全局默认即可
});
```

---

### ❌ 误区 2: gcTime 设置过短

```typescript
// ❌ 错误：gcTime 太短，无法防止误操作
useQuery({
    queryKey: ['data', id],
    gcTime: 100, // 100ms 太短
});

// ✅ 正确：根据实际场景设置
useQuery({
    queryKey: ['data', id],
    gcTime: 3 * 1000, // 3秒（快速误操作）
    // 或使用全局默认 5分钟
});
```

---

### ❌ 误区 3: 修改全局配置影响其他模块

```typescript
// ❌ 错误：为了一个页面修改全局配置
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 影响所有模块
        },
    },
});

// ✅ 正确：在业务层覆盖
useQuery({
    queryKey: ['specific', 'data'],
    staleTime: 10 * 60 * 1000, // 仅影响当前查询
});
```

---

## 📊 配置决策树

```
需要配置 React Query？
  ├─ 是否为稳定数据（如课程详情、字典）？
  │   ├─ 是 → 配置 staleTime（5-10分钟）
  │   └─ 否 → 使用全局默认（staleTime: 0）
  │
  ├─ 是否需要防快速误操作？
  │   ├─ 是 → 调整 gcTime（3秒或使用默认5分钟）
  │   └─ 否 → 使用全局默认
  │
  ├─ 是否为必需数据？
  │   ├─ 是 → 配置 retry: 1
  │   └─ 否 → retry: false（全局默认）
  │
  └─ 其他配置使用全局默认
```

---

## 🔍 调试技巧

### 1. 使用 React Query DevTools

```typescript
// 开发环境自动启用（左下角）
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 观察查询状态
fresh    → 数据新鲜（staleTime 内）
fetching → 正在请求
stale    → 数据过期（staleTime=0 时立即过期）
inactive → 查询未使用（gcTime 后清除）
```

---

### 2. 检查缓存行为

```typescript
// 在组件中打印查询状态
const { data, isStale, isFetching } = useQuery({...});

console.log('数据:', data);
console.log('是否过期:', isStale);      // staleTime=0 时总是 true
console.log('是否请求中:', isFetching);
```

---

### 3. 手动失效缓存

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// 失效指定查询
queryClient.invalidateQueries({
    queryKey: ['study', 'progress', userId],
});

// 失效所有匹配的查询
queryClient.invalidateQueries({
    queryKey: ['study'],
});
```

---

## 📚 参考文档

- [React Query 官方文档 - staleTime](https://tanstack.com/query/latest/docs/react/guides/important-defaults#staletime)
- [React Query 官方文档 - gcTime](https://tanstack.com/query/latest/docs/react/guides/caching#garbage-collection)
- [项目全局配置](../src/utils/queryClient.ts)
- [迁移指南](./react-query-migration-guide.md)

---

**最后更新**: 2025-10-18  
**维护人**: 开发团队

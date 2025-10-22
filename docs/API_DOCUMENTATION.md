# API 调用文档

## 用户信息管理 (UserInfo)

### 功能概述

全局用户信息管理，提供用户数据的获取、状态管理和错误处理。

### 作用范围

- **全局范围**：所有页面都可以访问用户信息
- **自动获取**：应用启动时自动调用 `getUserInfo` 接口
- **状态管理**：提供加载状态、错误状态和刷新功能

### API 接口

#### 1. 获取用户信息

```typescript
getUserInfo(): Promise<AppResponse<UserInfo>>
```

- **功能**：获取当前用户的基本信息
- **返回**：用户信息对象
- **自动调用**：应用启动时自动执行

### Hook 使用

#### useUserInfo Hook

```typescript
const { userInfo, loading, error, refreshUserInfo } = useUserInfo();
```

**返回值说明：**

- `userInfo: UserInfo | null` - 用户信息对象
- `loading: boolean` - 加载状态
- `error: string | null` - 错误信息
- `refreshUserInfo: () => Promise<void>` - 刷新用户信息

### 使用示例

#### 基础使用

```tsx
import { useUserInfo } from '@/hooks/useUserInfo';

const UserProfile = () => {
    const { userInfo, loading, error, refreshUserInfo } = useUserInfo();

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error}</div>;

    return (
        <div>
            <h1>欢迎, {userInfo?.nickname || userInfo?.username}</h1>
            <img src={userInfo?.avatar} alt='头像' />
            <button onClick={refreshUserInfo}>刷新用户信息</button>
        </div>
    );
};
```

#### 条件渲染

```tsx
const Header = () => {
    const { userInfo, loading } = useUserInfo();

    return (
        <header>
            {loading ? (
                <div>加载中...</div>
            ) : userInfo ? (
                <div>
                    <span>{userInfo.nickname}</span>
                    <img src={userInfo.avatar} alt='头像' />
                </div>
            ) : (
                <div>未登录</div>
            )}
        </header>
    );
};
```

#### 错误处理

```tsx
const UserDashboard = () => {
    const { userInfo, loading, error, refreshUserInfo } = useUserInfo();

    if (loading) {
        return <Spin size='large' />;
    }

    if (error) {
        return (
            <div>
                <Alert message='获取用户信息失败' type='error' />
                <Button onClick={refreshUserInfo}>重试</Button>
            </div>
        );
    }

    return <div>用户信息: {JSON.stringify(userInfo)}</div>;
};
```

---

## 课程信息管理 (Course)

### 功能概述

课程详情管理，提供课程数据的获取、状态管理和错误处理。根据路由参数智能判断是否需要课程上下文。

### 作用范围

- **智能范围**：只有包含 `courseId` 参数的路由才会提供课程上下文
- **自动获取**：当检测到 `courseId` 时自动调用 `getCourseDetail` 接口
- **状态管理**：提供加载状态、错误状态和课程详情

### API 接口

#### 1. 获取课程详情

```typescript
getCourseDetail(courseId: number): Promise<AppResponse<CourseDetail>>
```

- **功能**：根据课程ID获取课程详细信息
- **参数**：`courseId` - 课程ID
- **返回**：课程详情对象
- **自动调用**：当路由包含 `courseId` 时自动执行

### Hook 使用

#### useCourseDetail Hook

```typescript
const { courseDetail, loading, error } = useCourseDetail();
```

**返回值说明：**

- `courseDetail: CourseDetail | null` - 课程详情对象
- `loading: boolean` - 加载状态
- `error: Error | null` - 错误信息

### 使用示例

#### 基础使用

```tsx
import { useCourseDetail } from '@/hooks/useCourseDetail';

const CourseHeader = () => {
    const { courseDetail, loading, error } = useCourseDetail();

    if (loading) return <div>加载课程信息中...</div>;
    if (error) return <div>加载失败: {error.message}</div>;

    return (
        <div>
            <h1>{courseDetail?.courseName}</h1>
            <p>{courseDetail?.description}</p>
            <span>课程时长: {courseDetail?.duration}分钟</span>
        </div>
    );
};
```

#### 课程信息展示

```tsx
const CourseInfo = () => {
    const { courseDetail, loading } = useCourseDetail();

    if (loading) {
        return <Skeleton active />;
    }

    if (!courseDetail) {
        return <Empty description='暂无课程信息' />;
    }

    return (
        <Card title='课程信息'>
            <Descriptions column={2}>
                <Descriptions.Item label='课程名称'>{courseDetail.courseName}</Descriptions.Item>
                <Descriptions.Item label='课程描述'>{courseDetail.description}</Descriptions.Item>
                <Descriptions.Item label='课程时长'>{courseDetail.duration}分钟</Descriptions.Item>
                <Descriptions.Item label='课程状态'>{courseDetail.status}</Descriptions.Item>
            </Descriptions>
        </Card>
    );
};
```

#### 条件渲染

```tsx
const CourseContent = () => {
    const { courseDetail, loading, error } = useCourseDetail();

    // 加载状态
    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <Spin size='large' />
            </div>
        );
    }

    // 错误状态
    if (error) {
        return <Result status='error' title='加载失败' subTitle={error.message} extra={<Button type='primary'>重试</Button>} />;
    }

    // 无课程信息
    if (!courseDetail) {
        return <Empty description='暂无课程信息' />;
    }

    // 正常渲染
    return (
        <div>
            <h2>{courseDetail.courseName}</h2>
            <div>{courseDetail.description}</div>
        </div>
    );
};
```

#### 在视频学习页面使用

```tsx
// 路由: /course/:courseId/video/...
const VideoStudyPage = () => {
    const { courseDetail, loading } = useCourseDetail();
    const { userInfo } = useUserInfo();

    return (
        <div className='video-study-page'>
            <div className='header'>
                {loading ? <Skeleton.Input active /> : <h1>{courseDetail?.courseName}</h1>}
                <div className='user-info'>欢迎, {userInfo?.nickname}</div>
            </div>
            <div className='video-content'>{/* 视频播放器 */}</div>
        </div>
    );
};
```

### 类型定义

#### UserInfo 类型

```typescript
interface UserInfo {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    role?: string;
    permissions?: string[];
    [key: string]: any;
}
```

#### CourseDetail 类型

```typescript
interface CourseDetail {
    courseId: number;
    courseName: string;
    description?: string;
    duration?: number;
    status?: string;
    // 其他课程相关字段
    [key: string]: any;
}
```

### 注意事项

1. **用户信息**：
    - 应用启动时自动获取
    - 全局可用，所有页面都能访问
    - 支持手动刷新

2. **课程信息**：
    - 只有包含 `courseId` 的路由才会自动获取
    - 智能判断，避免不必要的 API 调用
    - 布局组件不需要关心课程上下文

3. **错误处理**：
    - 两个 Hook 都提供完整的错误状态
    - 建议在组件中进行适当的错误处理

4. **性能优化**：
    - 课程上下文只在需要时创建
    - 用户上下文全局共享
    - 避免重复的 API 调用

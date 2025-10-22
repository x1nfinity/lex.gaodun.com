# API 字段转换规范

## 概述

为了统一前后端数据交互规范，项目已配置全局字段转换功能，自动将接口返回的下划线字段转换为小驼峰格式。

## 功能特性

- ✅ **响应自动转换**：所有接口响应自动转换下划线字段为小驼峰
- ✅ **请求可选转换**：支持按需启用请求数据小驼峰转下划线
- ✅ **双向转换**：支持下划线↔小驼峰双向转换
- ✅ **配置化控制**：支持按接口控制转换行为
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **递归转换**：支持嵌套对象和数组的字段转换
- ✅ **性能优化**：使用高效的转换库
- ✅ **健壮性**：完善的边界情况处理

## 使用方式

### 1. 默认使用（推荐）

```typescript
// 接口返回：{ user_name: 'John', user_info: { first_name: 'John' } }
// 自动转换为：{ userName: 'John', userInfo: { firstName: 'John' } }

import { getCourseDetail } from '@/apis/course';

const course = await getCourseDetail(123);
console.log(course.result.courseName); // 自动转换后的字段
```

### 2. 启用请求数据转换

```typescript
import Http from '@/utils/http';

// 方式一：启用请求数据转换（推荐）
const requestData = {
    userName: 'John',
    userInfo: {
        firstName: 'John',
        lastName: 'Doe',
    },
};

// 自动转换请求数据：小驼峰 → 下划线
const response = await Http.post('/api/user', requestData, {
    enableRequestTransform: true, // 启用请求数据转换
});
// 实际发送: { user_name: 'John', user_info: { first_name: 'John', last_name: 'Doe' } }
```

### 3. 手动转换（特殊场景）

```typescript
import { toSnakeCaseKeys } from '@/utils';
import Http from '@/utils/http';

// 手动转换（适用于需要精确控制的场景）
const requestData = {
    userName: 'John',
    userInfo: {
        firstName: 'John',
        lastName: 'Doe',
    },
};

const transformedData = toSnakeCaseKeys(requestData);
// 结果: { user_name: 'John', user_info: { first_name: 'John', last_name: 'Doe' } }

const response = await Http.post('/api/user', transformedData);
```

### 4. 禁用转换（特殊情况）

```typescript
import Http from '@/utils/http';

// 禁用响应数据转换
const response = await Http.get(
    '/api/special-endpoint',
    {},
    {
        disableTransform: true, // 禁用响应数据转换
    }
);

// 同时禁用请求和响应转换
const response2 = await Http.post('/api/third-party', requestData, {
    disableTransform: true, // 禁用响应数据转换
    enableRequestTransform: false, // 禁用请求数据转换
});
```

### 5. 类型定义

```typescript
// 定义接口类型时，使用转换后的字段名
interface CourseDetail {
    courseName: string; // 对应后端的 course_name
    courseDescription: string; // 对应后端的 course_description
    teacherInfo: {
        // 对应后端的 teacher_info
        teacherName: string; // 对应后端的 teacher_name
    };
}
```

## 转换规则

### 下划线转小驼峰（响应数据）

| 后端字段格式   | 前端字段格式 | 示例           |
| -------------- | ------------ | -------------- |
| `user_name`    | `userName`   | 下划线转小驼峰 |
| `user_id_list` | `userIdList` | 多个下划线     |
| `user-name`    | `userName`   | 连字符转小驼峰 |
| `user name`    | `userName`   | 空格转小驼峰   |
| `USER_NAME`    | `userName`   | 大写转小驼峰   |

### 小驼峰转下划线（请求数据）

| 前端字段格式     | 后端字段格式       | 示例           |
| ---------------- | ------------------ | -------------- |
| `userName`       | `user_name`        | 小驼峰转下划线 |
| `userIdList`     | `user_id_list`     | 多个驼峰       |
| `HTMLParser`     | `html_parser`      | 连续大写字母   |
| `XMLHttpRequest` | `xml_http_request` | 复杂驼峰       |
| `APIKey`         | `api_key`          | 缩写+驼峰      |

## 最佳实践

### 1. 团队协作规范

- **统一使用**：所有新接口都使用全局转换，无需手动处理
- **类型定义**：定义接口类型时使用转换后的字段名
- **文档同步**：API 文档中标注字段转换规则

### 2. 特殊情况处理

```typescript
// 对于第三方接口或特殊格式的接口，使用 disableTransform
const thirdPartyData = await Http.get(
    '/third-party/api',
    {},
    {
        disableTransform: true,
    }
);
```

### 3. 性能考虑

- 转换功能已优化，对性能影响极小
- 仅在响应拦截器中进行一次转换
- 支持嵌套对象的递归转换

## 迁移指南

### 从手动转换迁移

```typescript
// 旧方式（不推荐）
const response = await getCourseDetail(123);
const transformedData = toCamelCaseKeys(response.result);

// 新方式（推荐）
const response = await getCourseDetail(123);
// 数据已自动转换，直接使用
console.log(response.result.courseName);
```

### 类型定义更新

```typescript
// 更新接口类型定义
interface CourseDetail {
    // 使用转换后的字段名
    courseName: string;
    courseDescription: string;
    teacherInfo: TeacherInfo;
}

interface TeacherInfo {
    teacherName: string;
    teacherAvatar: string;
}
```

## 注意事项

1. **向后兼容**：现有代码无需立即修改，可以逐步迁移
2. **类型安全**：确保 TypeScript 类型定义使用转换后的字段名
3. **测试覆盖**：确保单元测试覆盖字段转换功能
4. **文档更新**：及时更新 API 文档和团队规范

## 故障排除

### 常见问题

1. **字段未转换**：检查是否设置了 `disableTransform: true`
2. **类型错误**：确保类型定义使用转换后的字段名
3. **性能问题**：转换功能已优化，如遇性能问题请联系团队

### 调试方法

```typescript
// 在响应拦截器中添加调试日志
console.log('原始数据:', response.data);
console.log('转换后数据:', toCamelCaseKeys(response.data));
```

## API 参考

### 工具函数

#### `toCamelCase(str: string): string`

将字符串转换为小驼峰命名

```typescript
toCamelCase('user_name'); // 'userName'
toCamelCase('user-id-list'); // 'userIdList'
toCamelCase('user name'); // 'userName'
toCamelCase('USER_NAME'); // 'userName'
```

#### `toSnakeCase(str: string): string`

将字符串转换为下划线命名

```typescript
toSnakeCase('userName'); // 'user_name'
toSnakeCase('userIdList'); // 'user_id_list'
toSnakeCase('HTMLParser'); // 'html_parser'
toSnakeCase('XMLHttpRequest'); // 'xml_http_request'
toSnakeCase('APIKey'); // 'api_key'
```

#### `toCamelCaseKeys<T>(obj: T): T`

将对象的所有键从下划线转换为小驼峰

```typescript
toCamelCaseKeys({
    user_name: 'John',
    user_info: { first_name: 'John' },
});
// { userName: 'John', userInfo: { firstName: 'John' } }
```

#### `toSnakeCaseKeys<T>(obj: T): T`

将对象的所有键从小驼峰转换为下划线

```typescript
toSnakeCaseKeys({
    userName: 'John',
    userInfo: { firstName: 'John' },
});
// { user_name: 'John', user_info: { first_name: 'John' } }
```

### HTTP 配置选项

#### `disableTransform?: boolean`

是否禁用响应字段转换，默认为 `false`（启用转换）

```typescript
// 禁用响应数据转换
const response = await Http.get(
    '/api/endpoint',
    {},
    {
        disableTransform: true,
    }
);
```

#### `enableRequestTransform?: boolean`

是否启用请求字段转换，默认为 `false`（禁用转换）

```typescript
// 启用请求数据转换
const response = await Http.post('/api/endpoint', requestData, {
    enableRequestTransform: true,
});
```

#### 组合使用

```typescript
// 只转换请求数据，不转换响应数据
const response = await Http.post('/api/endpoint', requestData, {
    disableTransform: true, // 禁用响应转换
    enableRequestTransform: true, // 启用请求转换
});

// 只转换响应数据，不转换请求数据（默认行为）
const response2 = await Http.post('/api/endpoint', requestData, {
    // disableTransform: false,     // 默认启用响应转换
    // enableRequestTransform: false, // 默认禁用请求转换
});

// 同时转换请求和响应数据
const response3 = await Http.post('/api/endpoint', requestData, {
    disableTransform: false, // 启用响应转换
    enableRequestTransform: true, // 启用请求转换
});

// 同时禁用请求和响应转换
const response4 = await Http.post('/api/endpoint', requestData, {
    disableTransform: true, // 禁用响应转换
    enableRequestTransform: false, // 禁用请求转换
});
```

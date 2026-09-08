# 架构

## 业务目标

为个人提供轻量的点菜、菜谱生成和饮食日历记录工具，形成从灵感到复盘的完整闭环。

## 模块划分

| 模块 | 职责 |
|---|---|
| App | 页面状态、月历筛选、表单弹层编排 |
| CalendarBoard | 月历与日期选择、每日菜品概览 |
| DishList | 菜品卡片、评分、评价、图片与删除 |
| RecipeStudio | 类别/食材/偏好输入，AI 菜名与菜谱生成 |
| src/api/backend.ts | 后端请求、类型与错误处理 |

## 数据流

用户操作 → React 组件 → backend.ts → Cowork FastAPI → SSO 鉴权 → PostgreSQL / Runway AI → 返回页面。

## 关键决策

- 前端：React 18 + Vite + qiankun。
- UI：Ant Design，统一承载 DatePicker、Modal、Form、Upload、Rate 等复杂交互。
- 持久化：Cowork 注入 PostgreSQL，用户数据按 SSO userId 隔离。
- 图片：PostgreSQL Large Object，单张上限 5MB。
- AI：后端以一次纯文本调用 Runway，严格返回结构化菜谱 JSON。
- 页面：单页双栏工作台，桌面端日历+内容区，移动端纵向布局。

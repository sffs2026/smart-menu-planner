# 点菜应用后端接口

基础请求使用绝对 Cowork 地址并携带 credentials。

- GET `/api/dishes?month=YYYY-MM`：获取当前用户月度菜品。
- POST `/api/dishes`：创建菜品。
- PATCH `/api/dishes/{id}`：编辑菜名、类别、日期、菜谱、食材、评分、评价。
- DELETE `/api/dishes/{id}`：删除菜品及关联图片。
- POST `/api/dishes/{id}/image`：上传成品图，multipart 字段名 `image`，不超过 5MB。
- GET `/api/dishes/{id}/image`：读取当前用户自己的成品图。
- POST `/api/ai/recipe`：按类别、食材、偏好生成结构化菜谱。

所有业务接口必须通过 Cowork Guard 注入的 SSO 身份鉴权。

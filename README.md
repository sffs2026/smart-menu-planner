# 今天吃什么

支持饮食日历、菜品图片、评分评价和智能菜谱推荐。

- Hi Work 版：按公司账号保存，使用服务端 AI。
- GitHub Pages 版：使用 Supabase 匿名账号与共享菜单，支持邀请码加入、多人同步和私有图片，无需手机号或邮箱。

## 外网构建

```bash
npm install
npm run build:public
```

# miniapp-react-starter

Hi Work MiniApp 工程化骨架 —— **React 18 + Vite + qiankun** 微前端版本。

> 基于《MiniApp 工程化改造技术方案》落地，框架选型由原方案的 Vue3 调整为 **React**。
> 其他设计原则（qiankun 加载、CDN 绝对路径、生命周期暴露、不绑组件库 / 状态管理）保持一致。

---

## 目录结构

```
.
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts          # CDN 绝对路径注入逻辑都在这里
├── index.html              # 唯一入口，含 #miniapp-root 挂载点
├── miniapp.json            # 项目级元信息（POD/Skill 用，不参与运行）
├── public/                 # 原样拷贝到产物根目录
└── src/
    ├── main.tsx            # qiankun 生命周期（bootstrap/mount/unmount）+ 独立运行兜底
    ├── main.css            # 全局样式（.miniapp-root 命名空间 + 通用布局）
    ├── App.tsx             # 根组件（LLM 主要编辑入口）
    ├── components/         # 业务组件，每个组件一个目录
    │   └── HelloPanel/
    │       ├── index.tsx   # 组件入口（顶部 import './index.css'）
    │       └── index.css   # 组件私有样式（.hello-panel* 前缀作命名空间）
    └── types/
        └── qiankun.ts      # IMiniAppHostContext / QiankunProps 类型契约
```

> 组件目录化约定：每个业务组件占一个目录（`components/<Name>/{ index.tsx, index.css }`），子组件就近拆同目录（`Wheel.tsx`），不再嵌套子文件夹。详见 SKILL.md E9。

---

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:5173` 即可，独立模式下会走 `if (!window.__POWERED_BY_QIANKUN__) render()` 分支。

---

## 生产构建（关键约束 ⚠️）

**所有产物里的资源路径都必须是 CDN 绝对路径**（避免被 qiankun 注入 dibp.devops.xiaohongshu.com 后找不到资源）。

构建命令：

```bash
VITE_CDN_BASE="https://picasso-private-1251524319.cos.ap-shanghai.myqcloud.com/formula-static/dibp/{buildId}/" \
  pnpm build
```

> `VITE_CDN_BASE` 必须以 `/` 结尾。
> CI/POD Skill 在构建前根据本次 `buildId` 拼好这个完整 URL 注入即可。
> 缺失该变量时，`vite.config.ts` 会直接抛错阻断构建（除非显式 `ALLOW_LOCAL_BUILD=true`）。

产出位于 `dist/`，目录结构：

```
dist/
├── index.html             # <script src="https://cdn/.../assets/xxx.js"> 全是绝对路径
├── manifest.json          # Vite 自带的产物清单（hash 索引）
└── assets/
    ├── react-vendor-[hash].js
    ├── index-[hash].js
    ├── index-[hash].css
    └── ...
```

---

## qiankun 接入约定

### 生命周期

`src/main.tsx` 已按 qiankun 约定导出：

- `bootstrap()` —— 一次性初始化
- `mount(props)` —— 主应用 `loadMicroApp` 时调用，传入 `container` + `contextProvider`
- `unmount()` —— 卸载时清理 React root
- `update(props)` —— 预留，本期未使用

### 主站 → MiniApp 上下文

主应用通过 qiankun props 注入 `contextProvider`，MiniApp 在业务代码里这样取：

```ts
const ctx = (window as any).__MINIAPP_CONTEXT__ as IMiniAppHostContext | undefined
ctx?.notify('success', '保存成功')
ctx?.openLink('https://dibp.devops.xiaohongshu.com/apps/aibibp')
```

类型契约见 `src/types/qiankun.ts`（`IMiniAppHostContext`）。

### SSO Cookie

因 qiankun 把脚本注入主站 `window`，所有 `fetch` / `XHR` 默认相对 `dibp.devops.xiaohongshu.com`，**SSO Cookie 自动随请求携带**，无需额外处理。

---

## LLM 编辑红线

| 文件 | 规则 |
|---|---|
| `node_modules/` `dist/` `pnpm-lock.yaml` | ❌ 禁止编辑 |
| `src/main.tsx` 顶部生命周期导出 | ❌ 禁止删除 / 改签名 |
| `index.html` 的 `#miniapp-root` 节点 | ❌ 禁止改 id |
| `vite.config.ts` 的 `base` 注入逻辑 | ❌ 禁止改成相对路径 |
| `App.tsx` 根元素的 `.miniapp-root` 类名 | ❌ 禁止删 |
| 全局样式 | ❌ 禁止裸 `html` / `body` / `:root` 选择器；❌ 禁止霸屏 `position: fixed; inset: 0` |
| 新装 npm 包 | ⚠️ 必须走 `pnpm-add` skill（白名单约束） |

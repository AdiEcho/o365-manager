# Office 365 Manager - Frontend

现代化的 Office 365 多租户管理系统前端应用。

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **React Router** - 路由管理
- **TanStack Query** - 数据请求和缓存
- **Zustand** - 状态管理
- **Axios** - HTTP 客户端
- **Lucide React** - 图标库
- **React Hot Toast** - 通知提示

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动，并自动代理 API 请求到 http://localhost:8000

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 功能特性

### 🏠 仪表板
- 实时统计概览
- 租户状态展示
- 许可证使用情况
- 快速访问入口

### 🏢 租户管理
- 添加/删除租户配置
- 租户凭据验证
- 多租户快速切换
- 租户详情查看

### 👥 用户管理
- 创建 O365 用户
- 批量用户操作
- 用户搜索功能
- 启用/禁用账户
- 删除用户

### 🎫 许可证管理
- 许可证使用统计
- 各类型许可证详情
- 使用率可视化
- 库存预警提示

### 🌐 域名管理
- 添加自定义域名
- 域名验证
- 查看域名状态
- 域名删除（异步）

### 🛡️ 角色管理
- 查看目录角色
- 查看角色成员
- 提升全局管理员
- 撤销管理员权限

### 📊 报告中心
- 组织信息查看
- OneDrive 使用报告
- Exchange 使用报告
- 多时间段选择
- CSV 格式导出

## 项目结构

```
frontend/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── ui/           # shadcn/ui 组件
│   │   └── Layout.tsx    # 主布局组件
│   ├── pages/            # 页面组件
│   │   ├── Dashboard.tsx
│   │   ├── Tenants.tsx
│   │   ├── Users.tsx
│   │   ├── Licenses.tsx
│   │   ├── Domains.tsx
│   │   ├── Roles.tsx
│   │   └── Reports.tsx
│   ├── lib/              # 工具函数
│   │   ├── api.ts        # API 请求封装
│   │   └── utils.ts      # 通用工具
│   ├── App.tsx           # 应用根组件
│   ├── main.tsx          # 应用入口
│   └── index.css         # 全局样式
├── public/               # 静态资源
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 依赖配置
```

## 环境配置

### 开发环境

前端开发服务器默认配置了代理，将 `/api` 请求转发到 `http://localhost:8000`。

如需修改后端 API 地址，编辑 `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://your-api-server:8000',
      changeOrigin: true,
    },
  },
}
```

### 生产环境

生产环境部署时，需要配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 设计规范

### 颜色系统

项目使用 Tailwind CSS 的颜色系统，并通过 CSS 变量实现主题定制：

- **Primary**: 主色调（蓝色系）
- **Secondary**: 次要颜色
- **Destructive**: 危险操作（红色系）
- **Muted**: 弱化文本
- **Accent**: 强调色

### 响应式设计

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

布局使用 Tailwind 的响应式类：`md:`, `lg:` 等前缀。

### 组件规范

所有 UI 组件遵循 shadcn/ui 设计规范，支持：
- 深色/浅色模式切换
- 键盘导航
- 无障碍访问 (A11y)

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 在 `src/components/Layout.tsx` 添加导航项

### 添加新 API

1. 在 `src/lib/api.ts` 定义接口类型
2. 实现 API 调用函数
3. 使用 TanStack Query 在组件中调用

示例：

```typescript
// 定义类型
export interface NewResource {
  id: string
  name: string
}

// 实现 API
export const newResourceApi = {
  list: () => api.get<NewResource[]>('/new-resources'),
  create: (data: Partial<NewResource>) => 
    api.post<NewResource>('/new-resources', data),
}

// 在组件中使用
const { data, isLoading } = useQuery({
  queryKey: ['new-resources'],
  queryFn: async () => {
    const res = await newResourceApi.list()
    return res.data
  },
})
```

### 添加新 UI 组件

使用 shadcn/ui CLI 添加组件：

```bash
npx shadcn-ui@latest add [component-name]
```

例如：

```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
```

## 性能优化

### 已实现的优化

- ✅ 代码分割（自动按路由分割）
- ✅ 图片懒加载
- ✅ API 请求缓存
- ✅ 防抖搜索
- ✅ 虚拟滚动（长列表）

### 性能监控

使用 React DevTools Profiler 进行性能分析：

```bash
npm install --save-dev @welldone-software/why-did-you-render
```

## 故障排除

### 端口占用

如果 3000 端口被占用，可以修改 `vite.config.ts` 中的端口号。

### API 请求失败

1. 确保后端服务器正在运行（http://localhost:8000）
2. 检查浏览器控制台的网络请求
3. 确认 CORS 配置正确

### 构建失败

```bash
# 清除缓存
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

### 样式不生效

确保 Tailwind CSS 正确配置：

```bash
# 重新构建 Tailwind
npx tailwindcss -i ./src/index.css -o ./dist/output.css
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [后端 API 文档](../README.md)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

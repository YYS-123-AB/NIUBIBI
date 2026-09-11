# 星座运势占卜站 - 部署教程

## 📖 项目简介

星座运势占卜站是一个纯前端项目，提供12星座运势查询、塔罗牌占卜、生日配对、幸运数字等功能。本项目使用原生 HTML + CSS + JavaScript 开发，无任何前端框架依赖，可直接部署到任意静态网站托管服务。

## ✨ 功能特性

- **12星座运势**：今日/本周/本月/本年/爱情/事业/财运/健康 8类运势
- **星座卡片网格**：12星座独立渐变配色，响应式 auto-fill 布局
- **塔罗牌抽牌**：3张牌正逆位抽取，带翻转动画和详细解读
- **生日配对**：星座算法匹配度计算，多维度评分
- **幸运数字**：每日幸运数字、幸运色、宜忌查询
- **搜索功能**：300ms防抖搜索，支持星座名/日期/性格关键词
- **暗/亮主题**：双主题切换，支持 localStorage 记忆和系统偏好
- **收藏功能**：收藏喜欢的星座，数据存储在 localStorage
- **Hash路由**：详情页使用 #/sign/aries 路由，支持直接访问
- **响应式设计**：三断点适配（桌面/平板/手机）
- **回到顶部**：滚动自动显示，一键回到顶部

## 📁 项目结构

```
web20/
├── index.html                    # 主页面
├── css/
│   └── style.css                 # 样式文件 (~1200行)
├── js/
│   └── app.js                    # 核心逻辑
├── data/
│   └── data.json                 # 12星座+塔罗牌数据
├── scripts/
│   └── fetch-data.js             # 数据获取脚本（失败自动生成示例）
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── .nojekyll                     # 防止 GitHub Pages 使用 Jekyll
├── .gitignore                    # Git 忽略文件
├── package.json                  # 项目配置
├── vite.config.js                # Vite 构建配置（base:'./'）
└── DEPLOY.md                     # 本文档
```

## 🛠️ 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

## 📦 本地开发

### 1. 安装依赖

```bash
cd web20
npm install
```

### 2. 获取/生成数据

```bash
npm run fetch
```

此命令会尝试从远程数据源获取星座数据，获取失败时会自动生成完整的示例数据，无需担心数据缺失。

### 3. 启动开发服务器

```bash
npm run dev
```

或使用 `npm start`（监听 0.0.0.0 便于局域网访问）

访问地址：http://localhost:5173

### 4. 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接部署。

### 5. 本地预览生产版本

```bash
npm run preview
```

访问地址：http://localhost:4173

## 🚀 部署方式

### 方式一：GitHub Pages（推荐，全自动）

项目已内置 GitHub Actions 工作流，只需简单配置即可实现推送代码自动部署。

#### 步骤

1. **创建 GitHub 仓库**

   将 web20 目录内容推送到 GitHub 仓库：

   ```bash
   cd web20
   git init
   git add .
   git commit -m "feat: 初始化星座运势占卜站"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **启用 GitHub Pages**

   - 打开 GitHub 仓库页面 → **Settings** → **Pages**
   - **Build and deployment** → **Source** 选择 **GitHub Actions**
   - 保存设置

3. **触发自动部署**

   - 推送代码到 `main` 分支会自动触发部署
   - 也可在 **Actions** 页面手动点击 **Run workflow** 触发
   - 部署完成后，访问地址为：`https://你的用户名.github.io/你的仓库名/`

#### 工作流说明

`.github/workflows/deploy.yml` 包含 **3 个 Job**：

| Job | 说明 |
|-----|------|
| `fetch-data` | 执行数据获取脚本，验证并上传数据文件 |
| `build` | 安装依赖 → 使用数据 → Vite 构建 → 上传构建产物 |
| `deploy` | 将构建产物部署到 GitHub Pages（仅非 PR 时执行） |

**3 种触发方式**：
- `on.push`：推送到 main/master 分支
- `on.pull_request`：PR 时运行构建（不部署），确保代码可构建
- `on.workflow_dispatch`：Actions 页面手动触发

### 方式二：Vercel 一键部署

1. 将代码推送到 GitHub 仓库
2. 打开 [vercel.com](https://vercel.com)，使用 GitHub 登录
3. 点击 **New Project** → Import 你的仓库
4. 配置项保持默认即可：
   - Framework Preset：Vite
   - Build Command：`npm run build`
   - Output Directory：`dist`
   - Install Command：`npm install`
5. 点击 **Deploy**，等待一分钟即可

**自定义域名**：在 Vercel 项目的 **Settings → Domains** 中添加你的域名，按提示配置 DNS 即可。

### 方式三：Netlify 部署

1. 代码推送到 GitHub
2. 打开 [netlify.com](https://netlify.com)，使用 GitHub 登录
3. 点击 **Add new site** → **Import an existing project**
4. 选择你的仓库，配置：
   - Build command：`npm run build`
   - Publish directory：`dist`
5. 点击 **Deploy site**

### 方式四：Cloudflare Pages

1. 代码推送到 GitHub
2. 打开 Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → 选择仓库
4. 构建设置：
   - Framework preset：Vite
   - Build command：`npm run build`
   - Build output directory：`dist`
5. 点击 **Save and Deploy**

### 方式五：静态文件直传（Nginx/Apache/虚拟主机）

```bash
npm run build
```

将 `dist/` 目录下的所有文件上传到你的服务器根目录即可。

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/zodiac;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 方式六：本地直接打开（无构建）

由于项目是纯前端，使用相对路径引用资源，**无需构建也可直接运行**：

- 双击 `index.html` 即可在浏览器中打开
- 或使用任意静态服务器：

```bash
# Python 3
python -m http.server 8080

# Node.js (npx serve)
npx serve .

# PHP
php -S localhost:8080
```

## 🎨 12星座渐变配色表

| 星座 | 英文Key | 渐变色 |
|------|---------|--------|
| 白羊座 | aries | #ff6b6b → #ee5a24 |
| 金牛座 | taurus | #00b894 → #00cec9 |
| 双子座 | gemini | #fdcb6e → #f39c12 |
| 巨蟹座 | cancer | #74b9ff → #0984e3 |
| 狮子座 | leo | #ffd43b → #fab005 |
| 处女座 | virgo | #a8e6cf → #55a3a7 |
| 天秤座 | libra | #fd79a8 → #e84393 |
| 天蝎座 | scorpio | #a29bfe → #6c5ce7 |
| 射手座 | sagittarius | #74b9ff → #5f27cd |
| 摩羯座 | capricorn | #636e72 → #2d3436 |
| 水瓶座 | aquarius | #81ecec → #00cec9 |
| 双鱼座 | pisces | #a29bfe → #74b9ff |

## 🔌 Hash 路由说明

详情页使用 Hash 路由，支持直接分享链接：

```
#/sign/aries       白羊座详情
#/sign/taurus      金牛座详情
#/sign/gemini      双子座详情
#/sign/cancer      巨蟹座详情
#/sign/leo         狮子座详情
#/sign/virgo       处女座详情
#/sign/libra       天秤座详情
#/sign/scorpio     天蝎座详情
#/sign/sagittarius 射手座详情
#/sign/capricorn   摩羯座详情
#/sign/aquarius    水瓶座详情
#/sign/pisces      双鱼座详情
```

**弹窗三种关闭方式**：
1. ✕ 点击右上角关闭按钮
2. 🖱️ 点击弹窗遮罩区域
3. ⌨️ 按下键盘 `Esc` 键

## 💾 localStorage 存储项

| Key | 说明 |
|-----|------|
| `zodiac_theme` | 主题偏好 (`light` / `dark`) |
| `zodiac_favorites` | 收藏的星座 Key 数组 |
| `zodiac_data_cache` | 星座数据缓存（加速加载） |

## 🎯 功能算法说明

### 生日转星座算法

根据月日范围匹配对应星座，支持跨年的摩羯座（12.22-1.19）特殊处理。

### 塔罗牌抽牌算法

1. 从 22 张大阿卡纳中随机无重复抽取 3 张
2. 每张牌 35% 概率逆位，65% 概率正位
3. 3 张牌分别代表：**过去 → 现在 → 未来**

### 配对匹配度算法

```
最终得分 = 基础匹配分(星座配对表) 
         + 日期差异模数加成(-2 ~ +5)
         + 同元素/最佳配对/最差配对修正
```

并细分为 4 个子维度：感情契合、事业互助、财富共创、生活和谐。

### 每日幸运数字算法

以**日期戳 + 星座ID**作为哈希种子，保证同一星座同一天的幸运数字一致，次日自动更新。

## 📱 响应式断点

| 断点 | 设备类型 | 网格布局 |
|------|---------|---------|
| >= 1024px | 桌面端 | 12星座 4 列 / 工具 3 列 |
| 481px - 1023px | 平板 | 自适应 auto-fill 2-3列 |
| <= 480px | 手机 | 小卡片 2-3列 / 工具单列 |

## 🔍 搜索匹配范围

搜索框使用 300ms 防抖，支持匹配：
- ✅ 星座中文名 / 英文名
- ✅ 星座日期范围（如搜索"3月"匹配白羊座）
- ✅ 性格描述关键词
- ✅ 优点 / 缺点词条
- ✅ 四象属性（火/土/风/水）

## 🆘 常见问题

**Q: 为什么 GitHub Pages 部署后页面空白？**

A: 请确认仓库根目录存在 `.nojekyll` 文件（本项目已包含），并检查 Pages 设置中的 Source 是否选择了 GitHub Actions。

**Q: 直接双击 index.html 为什么有些功能不能用？**

A: 浏览器默认安全策略限制 `file://` 协议下的 fetch 请求，建议使用本地静态服务器运行，或部署后访问。

**Q: 如何修改星座数据？**

A: 直接编辑 `data/data.json` 即可，字段格式参照【星座字段】文档。修改后重新构建或刷新页面。

**Q: 塔罗牌可以添加小阿卡纳吗？**

A: 可以，将小阿卡纳卡牌追加到 `data.json` 的 `tarotCards` 数组，保持字段格式一致即可，抽牌算法会自动包含。

**Q: 如何自定义渐变配色？**

A: 编辑 `css/style.css` 顶部的 CSS 变量，每个星座有独立的 `--xx-gradient` / `--xx-color` / `--xx-light` 三个变量。

## 📄 License

MIT License - 仅供娱乐参考，星座内容不构成任何人生建议。

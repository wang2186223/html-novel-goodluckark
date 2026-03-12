# 免费狼人小说网站项目技术规格文档

## 项目概述
构建一个面向美国女性用户的免费狼人小说网站，专注于SEO优化和Google AI收录，使用静态HTML页面部署在GitHub Pages上。

## 核心需求分析

### 1. 网站架构设计

#### 1.1 页面结构
```
website/
├── index.html                    # 首页 - 小说列表展示
├── novels/                       # 小说目录
│   ├── novel-{id}/              # 单本小说目录
│   │   ├── index.html           # 小说详情页
│   │   ├── chapter-1.html       # 章节1阅读页
│   │   ├── chapter-2.html       # 章节2阅读页
│   │   └── ...                  # 更多章节
│   └── ...                      # 更多小说
├── assets/                      # 静态资源
│   ├── css/                     # 样式文件
│   ├── js/                      # JavaScript文件
│   └── images/                  # 图片资源
├── covers/                      # 小说封面图片
└── sitemap.xml                  # SEO站点地图
```

#### 1.2 URL结构设计（SEO友好）
- 首页: `https://yoursite.github.io/`
- 小说详情: `https://yoursite.github.io/novels/{novel-slug}/`
- 章节阅读: `https://yoursite.github.io/novels/{novel-slug}/chapter-{number}.html`

### 2. 数据库设计（JSON格式）

#### 2.1 小说索引文件 (`novels-index.json`)
```json
{
  "novels": [
    {
      "id": "novel-001",
      "title": "Abyssal Bonds",
      "slug": "abyssal-bonds",
      "author": "Author Name",
      "description": "小说描述...",
      "cover": "covers/abyssal-bonds.jpg",
      "genre": ["werewolf", "romance"],
      "status": "completed",
      "totalChapters": 45,
      "lastUpdated": "2024-09-14",
      "rating": 4.5,
      "tags": ["alpha", "mate", "pack"],
      "wordCount": 120000
    }
  ]
}
```

#### 2.2 章节索引文件 (`novels/{novel-slug}/chapters.json`)
```json
{
  "novel": "abyssal-bonds",
  "chapters": [
    {
      "number": 1,
      "title": "The Awakening",
      "filename": "chapter-1.html",
      "wordCount": 2500,
      "publishDate": "2024-09-01"
    }
  ]
}
```

### 3. 小说库结构规范

#### 3.1 当前结构分析
基于提供的 `novel library` 文件夹结构：
```
novel library/
├── Novel Title/
│   ├── 书籍描述.txt           # 小说描述
│   ├── 书籍正文.txt           # 小说正文（章节用###分割）
│   └── *.png/jpg              # 封面图片
```

#### 3.2 标准化处理流程
1. **文件夹名称** → 小说标题和URL slug
2. **书籍描述.txt** → 小说描述和元数据
3. **书籍正文.txt** → 按`###`分割为章节
4. **封面图片** → 统一格式和尺寸

### 4. 自动化脚本系统

#### 4.1 主脚本功能 (`build-website.py`)

**核心功能：**
1. **扫描检测**
   - 检测新增小说文件夹
   - 检测现有小说内容变化
   - 对比文件大小和修改时间

2. **HTML生成**
   - 首页生成（基于小说索引）
   - 小说详情页生成
   - 章节页面批量生成

3. **SEO优化**
   - 自动生成sitemap.xml
   - 优化meta标签
   - 结构化数据标记

4. **增量更新**
   - 只处理变更的内容
   - 保持现有页面不变
   - 更新索引文件

#### 4.2 脚本执行流程
```
1. 扫描 novel library 目录
2. 对比现有 novels-index.json
3. 识别新增/更新的小说
4. 解析小说内容和章节
5. 生成/更新对应HTML页面
6. 更新索引文件和sitemap
7. 生成部署报告
```

### 5. 广告和分析代码集成

#### 5.1 Google AdSense 集成
- 位置：所有页面的 `<head>` 部分
- 自动广告展示
- 响应式广告单元

#### 5.2 Google Analytics 4 集成
- 位置：所有页面的 `<head>` 部分
- 页面访问跟踪
- 用户行为分析

#### 5.3 代码模板
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-B6BKGBPW0W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B6BKGBPW0W');
</script>

<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3785399647875281"
     crossorigin="anonymous"></script>
```

### 6. SEO优化策略

#### 6.1 页面优化
- **标题标签**：`{小说标题} - Chapter {X} | NovelVibe`
- **描述标签**：包含关键词的描述
- **关键词标签**：werewolf, romance, alpha, mate等
- **Open Graph标签**：社交媒体分享优化

#### 6.2 结构化数据
```json
{
  "@type": "Book",
  "name": "小说标题",
  "author": "作者名",
  "genre": "Romance",
  "description": "小说描述"
}
```

#### 6.3 内部链接优化
- 小说间的相互推荐
- 章节间的导航链接
- 面包屑导航

### 7. 部署方案

#### 7.1 GitHub Pages 配置
- 仓库设置为公开
- 启用 GitHub Pages
- 使用自定义域名（可选）

#### 7.2 文件组织
```
repository/
├── docs/                    # GitHub Pages 根目录
│   ├── index.html
│   ├── novels/
│   ├── assets/
│   └── sitemap.xml
├── tools/                   # 构建工具
│   ├── build-website.py
│   ├── templates/
│   └── config.json
└── source/                  # 源数据
    └── novel library/
```

### 8. 技术栈

#### 8.1 前端技术
- **HTML5**：语义化标记
- **CSS3**：响应式设计，基于现有模板
- **JavaScript**：交互功能，无框架依赖
- **Font Awesome**：图标库

#### 8.2 构建工具
- **Python 3.8+**：主要脚本语言
- **依赖库**：
  - `beautifulsoup4`：HTML处理
  - `jinja2`：模板引擎
  - `markdown`：文本处理
  - `pillow`：图片处理

### 9. 开发时间线

#### 阶段1：基础架构（1-2天）
- 设置项目结构
- 创建HTML模板
- 配置基础样式

#### 阶段2：数据处理（2-3天）
- 开发小说解析脚本
- 实现章节分割逻辑
- 创建索引生成器

#### 阶段3：页面生成（2-3天）
- 开发HTML生成器
- 实现模板系统
- 添加SEO优化

#### 阶段4：部署和测试（1-2天）
- GitHub Pages 配置
- 性能优化
- SEO验证

### 10. 维护和扩展

#### 10.1 日常维护
- 定期运行构建脚本
- 监控网站性能
- 更新内容索引

#### 10.2 功能扩展
- 搜索功能
- 用户评论系统
- 推荐算法
- 移动应用

### 11. 质量保证

#### 11.1 测试策略
- HTML验证
- SEO检查
- 性能测试
- 移动端适配测试

#### 11.2 监控指标
- Google Search Console
- 页面加载速度
- 用户访问数据
- 广告收入统计

---

## 下一步行动

1. **确认技术方案**：审查本文档并提供反馈
2. **环境准备**：安装Python和必要依赖
3. **原型开发**：创建第一个小说的完整页面集
4. **脚本开发**：实现自动化构建工具
5. **部署测试**：在GitHub Pages上进行测试部署

## 成功指标

- 能够自动处理10,000本小说
- 每个小说平均100个独立HTML页面
- 页面加载速度 < 3秒
- Google PageSpeed Score > 90
- 成功收录到Google搜索结果

---

*文档版本：1.0*  
*最后更新：2024-09-14*  
*负责人：开发团队*

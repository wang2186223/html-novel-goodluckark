# 追踪参数保持系统说明文档

## 📋 功能概述

这个系统会自动保持 Facebook 和其他营销渠道的追踪参数（如 `fbclid`、`utm_*` 等），确保用户在网站内浏览时，这些参数始终存在，让 Google AdSense 能够正确识别流量来源。

## 🎯 解决的问题

**问题**：用户从 Facebook 广告点击进入网站时，URL 包含追踪参数：
```
https://re.cankalp.com/novels/heartbreak-billionairehe-should-never-have-let-go?fbclid=IwZXh0bgNhZW0...&utm_source=fb&utm_medium=paid
```

但当用户点击"下一章"或其他链接时，这些参数丢失：
```
https://re.cankalp.com/novels/heartbreak-billionairehe-should-never-have-let-go/chapter-2
```

导致 Google AdSense 将流量归类为"其他"而非"Facebook"。

## ✅ 解决方案

系统会自动：
1. **检测并保存**：当用户首次访问时，提取 URL 中的追踪参数并保存到 localStorage
2. **自动添加**：处理页面上的所有链接，自动添加追踪参数
3. **智能更新**：如果检测到新的追踪参数（用户从新的 Facebook 链接进入），自动更新存储
4. **自动过期**：参数保存 24 小时后自动过期，避免无限保留旧数据

## 📊 支持的追踪参数

系统会自动保持以下参数：

| 参数 | 来源 | 说明 |
|------|------|------|
| `fbclid` | Facebook | Facebook 点击 ID |
| `utm_source` | 通用 | 流量来源（如：fb, google） |
| `utm_medium` | 通用 | 流量媒介（如：paid, organic） |
| `utm_campaign` | 通用 | 营销活动 ID |
| `utm_content` | 通用 | 广告内容 ID |
| `utm_term` | 通用 | 广告关键词 |
| `utm_id` | 通用 | 营销活动 ID |

## 🔄 工作流程

### 场景 1: 用户从 Facebook 广告进入

1. **用户点击 Facebook 广告**
   ```
   原始链接: https://re.cankalp.com/novels/novel-name?fbclid=ABC123&utm_source=fb
   ```

2. **系统自动保存参数**
   ```javascript
   localStorage.setItem('tracking_params', '{"fbclid":"ABC123","utm_source":"fb"}')
   ```

3. **用户点击"下一章"**
   ```
   原始链接: /novels/novel-name/chapter-2
   系统自动修改为: /novels/novel-name/chapter-2?fbclid=ABC123&utm_source=fb
   ```

4. **Google AdSense 正确识别**
   ```
   流量来源: Facebook (而不是"其他")
   ```

### 场景 2: 用户从新的 Facebook 链接进入（新参数优先）

1. **用户之前访问过**
   ```
   存储的参数: {"fbclid":"OLD123","utm_source":"fb"}
   ```

2. **用户点击新的 Facebook 广告**
   ```
   新链接: https://re.cankalp.com/novels/another-novel?fbclid=NEW456&utm_source=fb&utm_campaign=spring2025
   ```

3. **系统更新存储（新参数优先）**
   ```javascript
   localStorage.setItem('tracking_params', '{"fbclid":"NEW456","utm_source":"fb","utm_campaign":"spring2025"}')
   ```

4. **后续浏览使用新参数**
   ```
   所有链接都会带上最新的追踪参数
   ```

### 场景 3: 用户直接访问（无参数）

1. **用户直接输入网址**
   ```
   访问: https://re.cankalp.com/
   ```

2. **系统检查存储**
   ```javascript
   const stored = localStorage.getItem('tracking_params');
   // 如果有之前的参数且未过期，继续使用
   // 如果没有参数，不添加任何参数（保持干净的URL）
   ```

3. **不会强制添加旧参数**
   - 如果用户是直接访问（没有任何追踪参数），系统**不会**添加之前保存的参数
   - 只有当用户带着追踪参数进入时，才会保持这些参数

## 🛠️ 技术实现

### 已更新的模板文件

所有页面模板都已添加追踪参数保持系统：

- ✅ `tools/templates/chapter.html` - 章节页面
- ✅ `tools/templates/index.html` - 首页
- ✅ `tools/templates/novel.html` - 小说介绍页
- ✅ `tools/templates/home.html` - 主页

### 核心功能

```javascript
// 1. 提取当前URL的追踪参数
extractTrackingParams(url)

// 2. 保存到 localStorage（24小时有效期）
saveTrackingParams(params)

// 3. 从 localStorage 读取（自动检查过期）
loadTrackingParams()

// 4. 为链接添加追踪参数
addTrackingParamsToUrl(url, params)

// 5. 处理页面上的所有链接
processPageLinks(params)

// 6. 监听动态添加的链接（使用 MutationObserver）
```

## 📱 兼容性

- ✅ **现代浏览器**：Chrome, Firefox, Safari, Edge
- ✅ **移动设备**：iOS Safari, Chrome Mobile
- ✅ **localStorage 支持**：所有支持 HTML5 的浏览器
- ✅ **隐私模式**：在隐私模式下，参数不会跨会话保留（符合预期）

## 🔍 调试信息

系统会在浏览器控制台输出详细的调试信息：

```javascript
// 当检测到新参数时
"检测到新的追踪参数，已更新存储"
"追踪参数已保存: {fbclid: 'ABC123', utm_source: 'fb'}"

// 当从存储加载参数时
"从存储加载追踪参数: {fbclid: 'ABC123', utm_source: 'fb'}"

// 当处理链接时
"已处理 156 个链接"

// 当参数过期时
"追踪参数已过期，已清除"
```

## ⚙️ 配置选项

可以在代码中修改以下配置：

```javascript
// 参数有效期（小时）
const EXPIRY_HOURS = 24; // 默认 24 小时

// 需要保持的参数列表
const TRACKING_PARAMS = [
    'fbclid',        // Facebook Click ID
    'utm_source',    // 流量来源
    'utm_medium',    // 流量媒介
    'utm_campaign',  // 营销活动
    'utm_content',   // 广告内容
    'utm_term',      // 广告关键词
    'utm_id'         // 营销 ID
];
```

## 📊 效果验证

### 在 Google AdSense 中验证

1. 登录 Google AdSense
2. 进入"报告" → "流量来源"
3. 应该能看到：
   - ✅ **Facebook** 流量正确识别
   - ✅ **付费流量** (utm_medium=paid) 正确标记
   - ❌ 不再有大量"其他"来源的流量

### 在浏览器中验证

1. 打开控制台（F12）
2. 从 Facebook 链接进入网站
3. 检查控制台输出：
   ```
   追踪参数已保存: {fbclid: "...", utm_source: "fb"}
   ```
4. 点击"下一章"链接
5. 检查新页面 URL，应该包含追踪参数

### 检查 localStorage

```javascript
// 在控制台运行
console.log(localStorage.getItem('tracking_params'));
// 输出: {"fbclid":"...","utm_source":"fb"}
```

## 🔐 隐私考虑

- ✅ **仅同域名**：只处理同域名的链接，不会泄露参数到外部网站
- ✅ **自动过期**：参数 24 小时后自动清除
- ✅ **本地存储**：数据仅存储在用户浏览器中，不会发送到服务器
- ✅ **符合 GDPR**：追踪参数的保持是为了正确归因流量，符合合规要求

## 🚀 部署说明

系统已自动部署到所有页面，无需额外配置。

### 验证部署

1. 构建网站：
   ```bash
   python3 tools/build-website.py --force
   ```

2. 检查生成的 HTML 文件，应该包含追踪参数保持脚本

3. 部署到生产环境

## 📝 注意事项

1. **新参数优先**：如果用户从新的 Facebook 链接进入，新参数会覆盖旧参数
2. **不影响直接访问**：如果用户直接访问（无参数），不会强制添加旧参数
3. **不影响域名上报**：追踪参数不会影响正常的域名和页面 URL 上报到 Analytics
4. **24小时有效期**：参数会在 24 小时后自动过期，避免长期污染数据

## 🎉 预期效果

实施后，你应该看到：

1. ✅ Google AdSense 中 Facebook 流量占比增加
2. ✅ "其他"来源流量占比减少
3. ✅ 付费流量（utm_medium=paid）正确识别
4. ✅ 营销活动效果更准确追踪
5. ✅ 用户在网站内浏览时，URL 始终带有追踪参数

---

**最后更新**：2025年10月22日  
**版本**：1.0  
**适用于**：所有页面（chapter.html, index.html, novel.html, home.html）

# Apps Script 部署更新日志

## 📅 更新日期
2025年10月15日 下午2:32

## 🔄 更新内容

### 新部署版本信息
- **版本**: 第4版
- **部署作業 ID**: `AKfycbwCb7SM9YZu6NVotQGD00m0zFocsO0loZpIYdD6g7RcbCiq5gQZI_uBA363PjxLW1P5cg`
- **網頁應用程式網址**: https://script.google.com/macros/s/AKfycbwCb7SM9YZu6NVotQGD00m0zFocsO0loZpIYdD6g7RcbCiq5gQZI_uBA363PjxLW1P5cg/exec

### 旧部署版本信息
- **旧部署作業 ID**: `AKfycbzPD8lLkK8-XkzWP1EfztR9ESfx1keij2SUYXowX28uDIcmdp_nYf9QRyxWCbuEdQJZmg`

## 📝 更新范围

### 已更新的文件
1. **tools/templates/chapter.html**
   - 页面访问统计上报（2处）
   - 广告引导事件上报（2处）
   - **共计**: 4处URL更新

### 应用范围
通过 `python3 tools/build-website.py --force` 重新构建后，新的Apps Script URL已应用到：
- ✅ 所有章节页面（chapter-*.html）
- ✅ 7本小说的所有章节
- ✅ 页面访问统计功能
- ✅ 广告引导弹窗统计功能

## 🎯 功能说明

### 1. 页面访问统计
每次用户访问章节页面时，会上报以下数据到Google Sheets：
- 访问时间（北京时间）
- 访问页面URL
- 用户浏览器信息
- 来源页面
- 用户IP地址

### 2. 广告引导事件统计
当广告引导弹窗显示时，会上报以下数据：
- 事件类型：`ad_guide_triggered`
- 累计看到的广告数量
- 当前页面的广告数量
- 完整的用户信息和时间戳

## 📊 数据存储

### Google Sheets 位置
- **Spreadsheet ID**: `1hO9dXSL6mG9UJlhSgVp-5nyKk3YGtU7hg205iortWek`
- **URL**: https://docs.google.com/spreadsheets/d/1hO9dXSL6mG9UJlhSgVp-5nyKk3YGtU7hg205iortWek/

### 工作表结构
1. **📊控制台** - 实时统计概览
2. **详细-日期** - 每日页面访问详细记录
3. **📈统计汇总表** - 按书籍汇总的访问统计
4. **广告引导-日期** - 广告引导事件记录

## ✅ 验证结果

构建完成后验证：
- ✅ 所有章节HTML文件已更新为新的URL
- ✅ 构建成功，共7本小说
- ✅ 统计功能正常工作

## 🔧 技术细节

### URL更新位置
```javascript
// 位置1 & 2: 页面访问统计（第155行 & 第174行）
fetch('https://script.google.com/macros/s/AKfycbwCb7SM9YZu6NVotQGD00m0zFocsO0loZpIYdD6g7RcbCiq5gQZI_uBA363PjxLW1P5cg/exec', {...})

// 位置3 & 4: 广告引导事件上报（第1245行 & 第1272行）
fetch('https://script.google.com/macros/s/AKfycbwCb7SM9YZu6NVotQGD00m0zFocsO0loZpIYdD6g7RcbCiq5gQZI_uBA363PjxLW1P5cg/exec', {...})
```

## 📋 后续步骤

1. ✅ 更新chapter.html模板中的URL
2. ✅ 重新构建网站应用更改
3. ⏭️ 推送到Git仓库
4. ⏭️ 部署到线上环境

## 🔗 相关文档
- [AD_GUIDE_ANALYTICS_FEATURE.md](./AD_GUIDE_ANALYTICS_FEATURE.md) - 广告引导统计功能文档
- [analytics-script.js](./analytics-script.js) - Google Apps Script源代码

---

**更新人员**: AI Assistant  
**部署版本**: 第4版  
**最后更新**: 2025年10月15日 下午2:32
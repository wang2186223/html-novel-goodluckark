# 邮件未收到问题排查指南

## 🔍 问题：北京时间01:00未收到邮件

## ✅ 立即检查清单

### 1. 检查触发器是否已设置

1. 打开 Google Sheets: https://docs.google.com/spreadsheets/d/1hO9dXSL6mG9UJlhSgVp-5nyKk3YGtU7hg205iortWek
2. 点击 **扩展程序 (Extensions)** → **Apps Script**
3. 在左侧菜单点击 **触发器** (⏰ 图标)
4. 查看是否有 `sendDailyEmailReport` 函数的触发器

**如果没有触发器，需要添加：**
- 点击 **+ 添加触发器**
- 选择要运行的函数: `sendDailyEmailReport`
- 选择事件来源: 时间驱动
- 选择时间类型: 天定时器
- 选择时间: 凌晨1点至2点
- 点击 **保存**

### 2. 检查触发器执行历史

在触发器页面：
1. 找到 `sendDailyEmailReport` 触发器
2. 点击右侧的三个点 **···** → **执行**
3. 查看最近的执行记录

**可能的情况：**
- ❌ 无执行记录 → 触发器未运行
- ⚠️ 执行失败 → 查看错误信息
- ✅ 执行成功 → 检查邮箱和垃圾邮件

### 3. 检查时区设置

**非常重要！** Google Apps Script 的时区必须设置为 Asia/Shanghai

1. 在 Apps Script 编辑器中
2. 点击左侧 **项目设置** (⚙️ 齿轮图标)
3. 找到 **时区** 设置
4. 确认是否为 **(GMT+08:00) 中国标准时间 - 上海** 或 **Asia/Shanghai**

**如果不是，修改为：**
- 下拉选择 **Asia/Shanghai** 或搜索 **Shanghai**
- 保存设置

### 4. 检查代码是否已更新

在 Apps Script 编辑器中：
1. 查看代码中是否包含 `sendDailyEmailReport` 函数
2. 查看代码中是否包含 `testEmailReport` 函数
3. 确认 Spreadsheet ID 是否正确: `1hO9dXSL6mG9UJlhSgVp-5nyKk3YGtU7hg205iortWek`

### 5. 检查邮箱

1. 查看收件箱
2. **重点检查垃圾邮件/促销邮件文件夹**
3. 搜索发件人: "NovelVibe Analytics"
4. 搜索主题: "统计报告"

## 🧪 立即测试

### 方法1: 手动测试邮件发送

1. 在 Apps Script 编辑器中
2. 选择函数: `testEmailReport`
3. 点击 **运行** (▶️)
4. 查看执行日志
5. 检查邮箱是否收到测试邮件

### 方法2: 手动触发每日报告

1. 在 Apps Script 编辑器中
2. 选择函数: `sendDailyEmailReport`
3. 点击 **运行** (▶️)
4. 这会发送昨天（2025-10-20）的报告
5. 检查邮箱

## 📊 查看执行日志

运行函数后：
1. 在 Apps Script 编辑器下方会显示 **执行日志**
2. 或点击 **查看** → **日志** (Ctrl/Cmd + Enter)
3. 查看详细的执行信息和可能的错误

**正常日志应该显示：**
```
=== 开始生成每日邮件报告 ===
统计日期: 2025-10-20
开始生成Excel报告...
✅ Excel报告生成成功（完整表格）
✅ 邮件发送成功: jannatjahan36487@gmail.com
```

**如果看到错误，请记录错误信息**

## 🔧 常见问题解决方案

### 问题1: 触发器未创建
**解决**: 按照上面"检查清单 → 1"的步骤创建触发器

### 问题2: 时区不对
**解决**: 修改项目时区为 Asia/Shanghai，然后重新创建触发器

### 问题3: 授权未完成
**解决**: 
1. 运行 `testEmailReport` 函数
2. 点击 "审核权限"
3. 选择 Google 账号
4. 点击 "高级" → "前往[项目名称]（不安全）"
5. 点击 "允许"
6. 重新运行函数

### 问题4: 代码未更新
**解决**: 
1. 复制 `/Users/k/Desktop/novel-free-my/html-adx-myfreenovel/analytics-script.js` 的完整内容
2. 粘贴到 Apps Script 编辑器
3. 点击保存 (💾)
4. 重新运行测试

### 问题5: Spreadsheet 权限问题
**解决**:
1. 确认您的 Google 账号有该 Spreadsheet 的编辑权限
2. 确认 Spreadsheet ID 正确: `1hO9dXSL6mG9UJlhSgVp-5nyKk3YGtU7hg205iortWek`

## 📝 下一步操作

### 立即执行（按顺序）：

1. **检查时区设置** ⚠️ 最重要
   - Apps Script → 项目设置 → 时区 → Asia/Shanghai

2. **检查触发器**
   - Apps Script → 触发器 → 查看是否有 sendDailyEmailReport

3. **运行测试函数**
   - 选择 `testEmailReport` → 运行
   - 查看日志和邮箱

4. **查看执行历史**
   - 触发器页面 → 点击触发器右侧 ··· → 执行
   - 查看今天凌晨01:00-02:00是否有执行记录

5. **记录错误信息**
   - 如果有任何错误，复制完整的错误信息

## 💡 快速诊断命令

在完成上述检查后，请提供以下信息：

- [ ] 触发器是否存在？
- [ ] 触发器状态（启用/禁用）？
- [ ] 时区设置是否为 Asia/Shanghai？
- [ ] 最近执行时间？
- [ ] 执行状态（成功/失败）？
- [ ] 如果失败，错误信息是什么？
- [ ] 运行 `testEmailReport` 的结果？

---
创建时间: 2025-10-21

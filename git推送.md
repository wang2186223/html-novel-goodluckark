# Git推送完整教程

## 🎯 快速推送（最常用）

当你要推送新增的小说或任何更改时，使用这个一键命令：

```bash
git add . && git commit -m "你的更新说明" && git push origin main
```

**示例：**
```bash
git add . && git commit -m "增加新小说：VEILBORN" && git push origin main
```

---

## 📋 详细推送流程

### 第1步：检查当前状态
```bash
git status
```

**你会看到类似输出：**
```
On branch main
Changes not staged for commit:
  modified:   docs/index.html
  modified:   tools/templates/index.html
Untracked files:
  source/新小说.txt
```

### 第2步：添加文件到暂存区
```bash
# 添加所有文件（推荐）
git add .

# 或者添加特定文件
git add source/新小说.txt
git add docs/
```

### 第3步：提交更改
```bash
git commit -m "你的提交说明"
```

**好的提交说明示例：**
- `git commit -m "增加新小说：VEILBORN (44章)"`
- `git commit -m "修复首页显示问题"`
- `git commit -m "优化Featured Novels随机显示"`
- `git commit -m "更新网站内容和功能"`

### 第4步：推送到GitHub
```bash
git push origin main
```

**成功推送会显示：**
```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
Writing objects: 100% (25/25), 2.1 MiB | 128.00 KiB/s, done.
Total 25 (delta 12), reused 0 (delta 0)
To https://github.com/wang2186223/html-01.git
   abc1234..def5678  main -> main
```

---

## 🔄 完整的新小说发布流程

### 1. 添加小说文件
将新小说的 `.txt` 文件放到 `source/` 目录

### 2. 生成网站文件
```bash
python3 tools/build-website.py
```

### 3. 检查生成结果
```bash
git status
ls docs/novels/  # 查看是否生成了新小说目录
```

### 4. 推送到GitHub
```bash
git add . && git commit -m "增加新小说：[小说名称]" && git push origin main
```

### 5. 验证推送成功
```bash
git log --oneline -3  # 查看最近3次提交
```

---

## 🛠️ 常用Git命令

### 查看状态和历史
```bash
git status                    # 查看当前状态
git log --oneline -5         # 查看最近5次提交
git diff                     # 查看文件变化
```

### 远程仓库操作
```bash
git remote -v                # 查看远程仓库地址
git pull origin main         # 拉取最新代码
git push origin main         # 推送到主分支
```

### 分支操作
```bash
git branch                   # 查看分支
git branch -v               # 查看分支详细信息
git checkout main           # 切换到主分支
```

---

## ⚠️ 常见问题及解决

### 问题1：推送被拒绝
```
error: failed to push some refs to 'github.com:username/repo.git'
```

**解决方法：**
```bash
git pull origin main         # 先拉取最新代码
git push origin main         # 再次推送
```

### 问题2：有未提交的更改
```
error: Your local changes would be overwritten by merge
```

**解决方法：**
```bash
git add .                    # 先添加所有更改
git commit -m "保存当前更改"   # 提交更改
git pull origin main         # 拉取最新代码
```

### 问题3：网络连接问题
```
fatal: unable to access 'https://github.com/...': Failed to connect
```

**解决方法：**
1. 检查网络连接
2. 重试推送命令
3. 检查GitHub访问权限

### 问题4：认证失败
```
fatal: Authentication failed
```

**解决方法：**
1. 检查GitHub用户名和密码
2. 如果使用Token，检查Token是否有效
3. 重新配置Git凭据

---

## 🎯 最佳实践

### 1. 提交说明规范
- ✅ **好的例子**：`增加新小说：VEILBORN (44章)`
- ❌ **不好的例子**：`更新`、`修改`、`test`

### 2. 频率建议
- 每增加一本新小说就推送一次
- 修复重要问题后及时推送
- 不要积累太多更改再推送

### 3. 推送前检查
- 确保网站能正常生成：`python3 tools/build-website.py`
- 检查重要文件是否存在：`ls docs/novels/`
- 查看更改内容：`git status`

### 4. 备份建议
- 定期备份 `source/` 目录（小说原文）
- 重要更改前先提交到Git
- 保持GitHub仓库为最新状态

---

## 📊 推送后验证

### 1. 检查GitHub仓库
访问：`https://github.com/wang2186223/html-01`
- 确认文件已上传
- 检查提交历史
- 验证新小说目录存在

### 2. 检查部署状态
如果使用Vercel等部署平台：
- 查看部署日志
- 访问实际网站确认更新
- 测试新小说页面

### 3. 本地验证
```bash
git log --oneline -1         # 确认最新提交
git remote show origin       # 检查远程状态
```

---

## 🚀 自动化脚本（可选）

创建一个快速发布脚本 `publish.sh`：

```bash
#!/bin/bash
# 快速发布新小说脚本

echo "🔄 生成网站..."
python3 tools/build-website.py

echo "📋 检查状态..."
git status

echo "📤 推送到GitHub..."
git add .
git commit -m "自动发布：$(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "✅ 发布完成！"
```

**使用方法：**
```bash
chmod +x publish.sh    # 给脚本执行权限
./publish.sh           # 运行脚本
```

---

*最后更新：2025年9月14日*
*包含最新的首页动态刷新机制说明*

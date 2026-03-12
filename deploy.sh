#!/bin/bash
# GitHub Pages 部署脚本

set -e

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "检测到未提交的更改，正在提交..."
    git add .
    git commit -m "Update website content - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 推送到 GitHub
echo "推送到 GitHub..."
git push origin main

echo "✅ 部署完成!"
echo "网站将在几分钟内更新: https://yourusername.github.io/novel-free-my"
echo ""
echo "📝 下一步:"
echo "1. 在 GitHub 仓库设置中启用 GitHub Pages"
echo "2. 选择 'Deploy from branch' 并选择 'main' 分支的 '/docs' 文件夹"
echo "3. 更新 config.json 中的网站 URL"

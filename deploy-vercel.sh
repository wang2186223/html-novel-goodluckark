#!/bin/bash
# Vercel部署脚本

set -e

echo "🚀 开始部署到Vercel..."

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm install -g vercel
fi

# 构建网站
echo "🏗️ 构建网站..."
python3 tools/build-website.py --force

# 检查构建结果
if [ ! -d "docs" ]; then
    echo "❌ 构建失败，docs目录不存在"
    exit 1
fi

echo "✅ 构建完成，生成了以下文件："
find docs -name "*.html" | wc -l | xargs echo "HTML文件数量:"

# 部署到Vercel
echo "🌐 部署到Vercel..."
cd docs

# 首次部署需要设置项目
if [ ! -f ".vercel/project.json" ]; then
    echo "🔧 首次部署，正在配置项目..."
    vercel --confirm
else
    echo "🔄 更新现有项目..."
    vercel --prod
fi

cd ..

echo "✅ 部署完成!"
echo ""
echo "📝 下一步:"
echo "1. 访问Vercel仪表板查看部署状态"
echo "2. 配置自定义域名(可选)"
echo "3. 设置环境变量和Webhook(可选)"
echo "4. 监控网站性能和分析数据"

#!/bin/bash

# 页面访问统计系统配置脚本
# 使用方法: ./setup-analytics.sh "你的Google_Apps_Script_URL"

if [ -z "$1" ]; then
    echo "使用方法: $0 '你的Google_Apps_Script_URL'"
    echo "示例: $0 'https://script.google.com/macros/s/你的脚本ID/exec'"
    exit 1
fi

SCRIPT_URL="$1"

echo "🔧 正在配置页面访问统计系统..."
echo "📍 Google Apps Script URL: $SCRIPT_URL"

# 替换所有模板文件中的占位符
echo "📝 更新模板文件..."
sed -i '' "s|YOUR_GOOGLE_APPS_SCRIPT_URL_HERE|$SCRIPT_URL|g" tools/templates/*.html

echo "✅ 配置完成！"
echo ""
echo "📋 下一步："
echo "1. 运行: python3 tools/build-website.py --force"
echo "2. 运行: git add . && git commit -m '添加页面访问统计功能' && git push origin main"
echo ""
echo "📊 查看数据：打开你的 Google Sheets 表格"
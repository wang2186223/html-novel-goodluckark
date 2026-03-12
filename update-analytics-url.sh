#!/bin/bash

# 快速替换 Google Apps Script URL 脚本
# 用法: ./update-analytics-url.sh "https://script.google.com/macros/s/YOUR_REAL_SCRIPT_ID/exec"

if [ $# -eq 0 ]; then
    echo "错误：请提供 Google Apps Script URL"
    echo "用法: ./update-analytics-url.sh \"https://script.google.com/macros/s/YOUR_REAL_SCRIPT_ID/exec\""
    exit 1
fi

NEW_URL="$1"
PLACEHOLDER_URL="https://script.google.com/macros/s/AKfycbxYOUR_SCRIPT_ID_PLACEHOLDER/exec"

echo "正在更新 Google Apps Script URL..."
echo "从: $PLACEHOLDER_URL"
echo "到: $NEW_URL"

# 更新模板文件
sed -i '' "s|$PLACEHOLDER_URL|$NEW_URL|g" tools/templates/chapter.html
sed -i '' "s|$PLACEHOLDER_URL|$NEW_URL|g" tools/templates/index.html 
sed -i '' "s|$PLACEHOLDER_URL|$NEW_URL|g" tools/templates/novel.html

echo "✅ 模板文件已更新"

# 重新生成所有页面
echo "正在重新生成所有页面..."
python3 tools/build-website.py --force

echo "✅ 所有页面已重新生成"
echo "📊 页面访问统计系统已激活！"
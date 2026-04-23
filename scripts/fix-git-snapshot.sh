#!/bin/bash

# OpenCode Git Snapshot 问题修复脚本
# 用于清理导致 snapshot 失败的运行时目录

echo "🔧 开始清理 OpenCode 运行时目录..."

# 1. 清理有问题的运行时文档目录
if [ -d ".opencode/openagent-labforge/runtime" ]; then
    echo "📁 发现运行时目录，正在清理..."
    rm -rf .opencode/openagent-labforge/runtime/*/documents/
    echo "✅ 已清理运行时文档目录"
fi

# 2. 重置 git 状态（如果目录被 git 追踪）
if git ls-files .opencode/ > /dev/null 2>&1; then
    echo "🔄 重置 .opencode 目录的 git 状态..."
    git rm -r --cached .opencode/ 2>/dev/null || true
    echo "✅ 已重置 git 状态"
fi

# 3. 确保 .gitignore 正确配置
if ! grep -q "^\.opencode/" .gitignore 2>/dev/null; then
    echo "📝 添加 .opencode/ 到 .gitignore..."
    echo ".opencode/" >> .gitignore
    echo "✅ 已更新 .gitignore"
else
    echo "✅ .gitignore 已正确配置"
fi

# 4. 清理 git 缓存
echo "🧹 清理 git 缓存..."
git gc --prune=now 2>/dev/null || true

echo ""
echo "✨ 清理完成！建议重启 OpenCode 以应用更改。"
echo ""
echo "如果问题仍然存在，请运行："
echo "  rm -rf .opencode/"
echo "  然后重启 OpenCode"

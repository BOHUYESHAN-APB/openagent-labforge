#!/bin/bash
# 验证 3.15.1 版本发布

echo "🔍 验证发布状态..."
echo ""

# 检查主包
echo "1️⃣ 检查主包："
npm view @bohuyeshan/openagent-labforge-core@3.15.1 version 2>/dev/null && echo "   ✅ 主包已发布" || echo "   ❌ 主包未发布"
echo ""

# 检查平台包
echo "2️⃣ 检查平台包："
platforms=(
  "darwin-arm64"
  "darwin-x64"
  "darwin-x64-baseline"
  "linux-x64"
  "linux-x64-baseline"
  "linux-arm64"
  "linux-x64-musl"
  "linux-x64-musl-baseline"
  "linux-arm64-musl"
  "windows-x64"
  "windows-x64-baseline"
)

success=0
failed=0

for platform in "${platforms[@]}"; do
  pkg="openagent-labforge-${platform}"
  if npm view "${pkg}@3.15.1" version &>/dev/null; then
    echo "   ✅ ${pkg}"
    ((success++))
  else
    echo "   ❌ ${pkg}"
    ((failed++))
  fi
done

echo ""
echo "📊 统计："
echo "   成功: ${success}/11"
echo "   失败: ${failed}/11"
echo ""

# 检查 GitHub Release
echo "3️⃣ 检查 GitHub Release："
if gh release view v3.15.1 &>/dev/null; then
  echo "   ✅ GitHub Release 已创建"
  echo ""
  echo "   Release 信息："
  gh release view v3.15.1 --json name,tagName,publishedAt,assets --jq '{name,tagName,publishedAt,assetCount: (.assets | length)}'
else
  echo "   ❌ GitHub Release 未创建"
fi

echo ""
echo "🎉 验证完成！"

# 本地发布 3.15.1 版本指南

## 前置准备

### 1. 配置 npm token

```bash
# 设置 npm token
npm config set //registry.npmjs.org/:_authToken YOUR_NPM_TOKEN_HERE

# 或者使用环境变量
export NPM_TOKEN=YOUR_NPM_TOKEN_HERE
```

### 2. 配置 npm 镜像（如果下载慢）

```bash
# 使用淘宝镜像加速依赖下载
npm config set registry https://registry.npmmirror.com

# 但发布时必须用官方源
npm config set registry https://registry.npmjs.org
```

### 3. 检查 Bun 版本

```bash
bun --version  # 需要 1.3.6+
```

## 发布步骤

### 方式A：使用发布脚本（推荐）

```bash
# 设置版本号和 token
export VERSION=3.15.1
export NPM_TOKEN=YOUR_NPM_TOKEN_HERE

# 运行发布脚本
bun run script/publish.ts
```

### 方式B：手动分步发布

```bash
# 1. 更新版本号
export VERSION=3.15.1
bun run script/publish.ts --prepare-only

# 2. 清理并构建
bun run clean
bun run build

# 3. 构建所有平台二进制文件（这一步可能会卡住）
bun run build:binaries

# 4. 发布主包
npm publish --access public

# 5. 发布平台包（逐个发布）
cd packages/darwin-arm64 && npm publish --access public && cd ../..
cd packages/darwin-x64 && npm publish --access public && cd ../..
cd packages/linux-x64 && npm publish --access public && cd ../..
cd packages/linux-arm64 && npm publish --access public && cd ../..
cd packages/windows-x64 && npm publish --access public && cd ../..
# ... 其他平台
```

## 常见问题

### 问题1：下载 bun 编译目标时卡住

**原因**：`bun build --compile` 需要下载对应平台的 bun 二进制文件

**解决方案**：使用镜像预下载

```bash
# 查看 bun 缓存目录
bun pm cache

# 手动下载编译目标（使用镜像）
BUN_VERSION=$(bun --version)

# 示例：下载 darwin-arm64
curl -fsSL "https://registry.npmmirror.com/@oven/bun-darwin-arm64/-/bun-darwin-arm64-${BUN_VERSION}.tgz" \
  -o /tmp/bun-darwin-arm64.tgz

# 解压到缓存目录
CACHE_DIR=$(bun pm cache)
mkdir -p "$CACHE_DIR"
tar -xzf /tmp/bun-darwin-arm64.tgz -C "$CACHE_DIR"
```

### 问题2：某些平台编译失败

**解决方案**：跳过平台包，只发布主包

```bash
export SKIP_PLATFORM_PACKAGES=true
bun run script/publish.ts
```

### 问题3：npm 发布权限错误

**检查**：
1. token 是否正确
2. 是否有 `@bohuyeshan` scope 的发布权限
3. 包名是否正确

```bash
# 测试 token
npm whoami --registry https://registry.npmjs.org
```

## 平台包说明

项目支持 11 个平台：

| 平台 | 说明 | 目标用户 |
|------|------|---------|
| darwin-arm64 | macOS Apple Silicon (M1/M2/M3) | Mac ARM 用户 |
| darwin-x64 | macOS Intel | Mac Intel 用户 |
| darwin-x64-baseline | macOS Intel (无 AVX2) | 老款 Mac |
| linux-x64 | Linux x64 (glibc) | Ubuntu/Debian/Fedora |
| linux-x64-baseline | Linux x64 (glibc, 无 AVX2) | 老款 Linux |
| linux-arm64 | Linux ARM64 (glibc) | 树莓派/ARM 服务器 |
| linux-x64-musl | Linux x64 (musl) | Alpine Linux |
| linux-x64-musl-baseline | Linux x64 (musl, 无 AVX2) | 老款 Alpine |
| linux-arm64-musl | Linux ARM64 (musl) | Alpine ARM |
| windows-x64 | Windows x64 | Windows 用户 |
| windows-x64-baseline | Windows x64 (无 AVX2) | 老款 Windows |

## 镜像配置

### npm 镜像

```bash
# 淘宝镜像
npm config set registry https://registry.npmmirror.com

# 恢复官方源（发布时必须）
npm config set registry https://registry.npmjs.org
```

### bun 镜像

Bun 会从 npm 下载编译目标，所以配置 npm 镜像即可。

## 验证发布

```bash
# 检查主包
npm view @bohuyeshan/openagent-labforge-core@3.15.1

# 检查平台包
npm view openagent-labforge-darwin-arm64@3.15.1
npm view openagent-labforge-linux-x64@3.15.1
npm view openagent-labforge-windows-x64@3.15.1
```

## 推荐流程

**最稳定的方式是使用 GitHub Actions**，因为：
1. CI 环境网络稳定
2. 自动处理所有平台编译
3. 支持失败重试
4. 已发布的包会自动跳过

如果必须本地发布，建议：
1. 先发布主包（不含二进制）
2. 使用 GitHub Actions 发布平台包

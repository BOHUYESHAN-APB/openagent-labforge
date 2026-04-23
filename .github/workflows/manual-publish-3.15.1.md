# 手动触发发布 3.15.1

1. 访问 GitHub Actions 页面：
   https://github.com/BOHUYESHAN-APB/openagent-labforge/actions/workflows/publish.yml

2. 点击 "Run workflow" 按钮

3. 填写参数：
   - bump: 选择 "patch"（或其他）
   - version: 输入 "3.15.1"（这个优先级更高）
   - skip_platform: 不勾选（需要发布所有平台）

4. 点击 "Run workflow" 开始发布

## 注意事项

- GitHub Actions 会自动处理所有平台的编译
- 使用 npm OIDC 认证（需要在 npm 配置 Trusted Publishing）
- 如果某个平台已发布，会自动跳过
- 发布失败可以重新运行，已发布的包不会重复发布

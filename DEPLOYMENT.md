# 祭祖后台部署说明

已部署版本：`106f89dd20d4e6d3c24d9a67004902e4b5210f29`。Actions运行：https://github.com/CarminBack/ancestor-admin-vben/actions/runs/34810887616 。

2026-09-14验收：镜像healthy、HTTPS有效、Chrome登录及核心页面、下单→待处理→确认付款→小程序状态同步通过；验收订单已取消。默认123456密码不可登录。服务器不能访问Docker Hub，但本次成功从GHCR拉取Actions镜像。

镜像仅由 GitHub Actions 工作流 `.github/workflows/deploy.yml` 构建，目标 `linux/amd64`。本机和服务器均不构建 Docker 镜像。

## 发布链路

1. 将业务变更推送到 `CarminBack/ancestor-admin-vben` 的 main 分支。
2. Actions 构建 `playground` 和 Nitro，启动镜像进行API及静态资源冒烟测试。
3. Actions 发布到 `ghcr.io/carminback/ancestor-admin-vben:<完整提交SHA>`，并保存含SHA256校验和的镜像包为7天有效的Artifact。
4. 服务器可以拉取GHCR时按固定SHA拉取；无法访问镜像仓库时下载Artifact，通过scp传入服务器并执行 `sha256sum -c`、`docker load`。
5. 执行 `bash deploy.sh ghcr.io/carminback/ancestor-admin-vben:<SHA>`。禁止根据漂移的latest判断实际部署版本。

## 服务器

- SSH：本机 `ssh js`，目标 root@39.107.32.221。
- 网站：https://js.mewinyou.asia
- 管理后台部署在域名根路径，API `/api/*`。
- 本地回环上游：127.0.0.1:8080，仅主机Nginx对公网提供服务。
- 运行目录：`/opt/ancestor-admin`。
- 业务数据：`/opt/ancestor-admin/data` → 容器 `/app/data`。
- 环境凭据：`/opt/ancestor-admin/runtime.env`，权限600，不提交仓库。
- 版本记录：`/opt/ancestor-admin/current-image`。
- 备份：`/opt/ancestor-admin/backups/data-<时间>.tar.gz`。

## 登录和数据

生产环境通过环境变量提供随机JWT密钥与管理员scrypt密码哈希。仅启用vben管理员，禁用内置演示账号密码。实际密码单独交付，不写入此文档。

业务仍使用本地JSON持久化存储，适用于当前单实例联调。此前本机测试数据不自动复制到线上。客服配置首次为空，需在系统设置填写。微信支付尚未接入，付款为管理员人工确认；演示管理员/角色管理模块不视为已实现的生产账号管理。

## TLS

Let's Encrypt证书由主机certbot webroot签发。路径 `/etc/letsencrypt/live/js.mewinyou.asia/`。HTTP的 `/.well-known/acme-challenge/` 保留用于续期，其他请求跳转HTTPS。

安装certbot.timer自动续期，并在deploy hook中执行 `nginx -t && systemctl reload nginx`。主机Nginx配置见 `deploy/host-nginx.conf`。

## 回滚

部署脚本在替换前停止旧写入进程、保留旧容器为 `ancestor-admin-rollback-<时间>` 并备份数据。新容器健康检查失败时自动恢复旧容器。首发失败时无旧应用可回滚，保留Nginx维护页面与数据。

需要人工回滚时先查看旧容器及current-image，停止新容器并恢复旧容器名称。数据恢复属于独立操作，必须先确认备份和后续写入影响，不要直接删除data目录。

## 验证边界

GitHub镜像冒烟测试必须成功，部署后检查容器healthy、首页/JS资源、API响应、认证和HTTPS证书。仓库全量类型检查目前存在之前复制到演示应用的缺失依赖错误，不代表该检查通过；本次镜像只构建playground业务前端。

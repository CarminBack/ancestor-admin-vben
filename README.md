# 祭祖管理后台

线上后台及API：https://js.mewinyou.asia 。镜像由GitHub Actions构建，生产部署说明见 [DEPLOYMENT.md](DEPLOYMENT.md)。本地开发地址保持如下。

管理前端是 `playground/`，后端是 `apps/backend-mock/`（Nitro）。`apps/web-antd/` 不是当前业务入口。微信小程序独立位于 `/Users/carmin/Documents/祭祀/祭祀2`。

## 启动

```bash
# 终端一：后端，默认5320
cd apps/backend-mock
pnpm run start

# 终端二：从仓库根目录进入业务前端，默认5174
cd playground
pnpm run dev
```

必须使用项目的 `pnpm run dev` 脚本。共享 Vite 配置根据 npm 生命周期选择环境；直接 `pnpm exec vite` 可能误加载生产 `/admin/` 基础路径。

- 管理后台：http://localhost:5174/
- 小程序API：http://localhost:5320
- 微信开发者工具本地测试需关闭合法域名校验。
- 真机不能使用 localhost。需另行配置后端监听局域网地址，或部署可访问的 HTTPS 服务。

## 已统一的业务链路

小程序下单、后台待处理列表、订单详情、确认收款、取消、用品发货、祭祀状态推进、视频记录、已完成记录查询、操作日志及概览使用同一个本地存储。

- 小程序响应 `code: 200`，后台响应 `code: 0`。
- 小程序 `pending_service` 在后台映射为 `PENDING_PAYMENT`。
- 后端计算套餐和规格价格、检查库存、取消回补库存，并支持 `Idempotency-Key` / `X-Request-Id`。
- 非法状态跳转、重复付款与重复取消返回409。
- 商品、分类、套餐、客服配置改动对小程序生效。
- 订单详情读取接口，视频开放时间和删除写入后端。

## 数据与视频

默认存储：`apps/backend-mock/data/ancestor/store.json`（以后端工作目录为基准）。可通过 `ANCESTOR_DATA_DIR` 指定绝对路径。数据目录已由 `.gitignore` 排除。

JSON原子替换及目录锁用于本地单机联调；每次请求读取文件，正常热重载/重启后订单保留。首次采用新存储时不迁移此前已经丢失的内存订单。不要删除数据目录。若写进程被强制终止并遗留 `write.lock`，确认没有写入进程后才能清理锁。

视频支持后台上传100MB以内MP4，存放在 `data/ancestor/media/`。本地播放支持Range及一小时签名；签名密钥存于数据目录 `media.key`（不提交）。已完成记录通过订单号或姓名组合精确查询，未到开放时间的视频不返回。第三方HTTPS视频链接由对应存储服务管理权限。

本地HTTP媒体用于开发调试。线上需要HTTPS、正式对象存储和密钥管理；当前实现不代表七牛云已配置。

## 验证

```bash
cd apps/backend-mock
pnpm exec nitro build
ANCESTOR_DATA_DIR=/tmp/ancestor-integration-data NITRO_PORT=5331 NITRO_HOST=127.0.0.1 node .output/server/index.mjs
```

另开终端，使用 ffmpeg 生成一秒测试MP4（或通过 `ANCESTOR_TEST_VIDEO` 指定已有测试视频），再运行：

```bash
ffmpeg -f lavfi -i color=c=black:s=160x120:d=1 -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y /tmp/ancestor-test-video.mp4
python3 tests/order-flow.py
```

测试只应指向独立测试服务，会创建订单、修改商品及客服配置。覆盖订单闭环、鉴权、幂等、库存、视频和查询。另已通过 Chrome 实际验证登录、待处理付款、订单详情、状态推进及MP4上传；重启后完成订单可再次查询。

## 范围说明

这是本地业务联调方案，不是生产数据库迁移。旧 MySQL `sha256_password` 认证未修复，订单相关接口已移除其依赖。管理员/角色模块的演示及旧实现不属于本次订单链路验收。微信支付、真实退款、正式对象存储和公网部署尚未完成。后台“确认付款”表示管理员手动确认收到款项。

# 项目入口与联调约定

- 祭祀管理前端在 `playground/`，用 `cd playground && pnpm run dev`，默认5174。不要启动或修改 `apps/web-antd` 来修复该业务后台。
- Nitro 后端在 `apps/backend-mock/`，默认5320。启动前先检查监听进程，避免重复服务自动换端口。
- 小程序是独立项目 `/Users/carmin/Documents/祭祀/祭祀2`。
- 当前订单/商品联调使用 `utils/local-store.ts` 持久化到后端 `data/ancestor/`。不要将订单操作重新接回尚不可用的 Prisma 或独立硬编码列表。
- 管理员接口响应code=0，小程序接口code=200；内部状态由 `ancestor-business.ts` 映射。先验证真实业务链路再声称完成。
- 本地视频位于数据目录，不是已经部署的七牛云；生产数据库/支付/公网部署仍需独立完成。
- 修复接口和功能时保留现有页面布局、样式及交互；未经用户要求，不整体重写或重新设计页面。
- 参考 README 的独立测试服务运行 `tests/order-flow.py`，勿对用户数据运行整套验收脚本。
- Obsidian日志：`/Users/carmin/Documents/Obsidian Vault/开发日志/祭祀2.md`（跨链接后台项目）。不要记录秘密。

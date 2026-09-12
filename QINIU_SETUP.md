# 七牛云上传功能 - 后端实现指南

## 一、七牛云配置信息

- **AccessKey**: [需要从 https://portal.qiniu.com/developer/user/key 获取]
- **SecretKey**: n3ZbxcOIxOTg-naiR7Ci0SDUw6a8bMwkegAf34u-
- **存储空间名称 (Bucket)**: zdxdwh
- **存储区域**: 华南-广东 (z2)
- **CDN 加速域名**: 需要在七牛云控制台绑定并配置（例如：https://cdn.zdxdwh.com）

## 二、后端需要实现的接口

### 1. 获取上传凭证接口

**接口地址**: `GET /api/ancestor/qiniu-token`

**返回数据**:
```json
{
  "token": "上传凭证字符串",
  "domain": "https://cdn.zdxdwh.com"
}
```

### 2. Node.js 后端实现示例

#### 安装依赖
```bash
npm install qiniu
```

#### 代码实现
```javascript
const qiniu = require('qiniu');

// 七牛云配置
const accessKey = '你的AccessKey';
const secretKey = 'n3ZbxcOIxOTg-naiR7Ci0SDUw6a8bMwkegAf34u-';
const bucket = 'zdxdwh';
const cdnDomain = 'https://cdn.zdxdwh.com'; // 你的CDN域名

// 生成上传凭证
function getUploadToken() {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  
  const options = {
    scope: bucket,
    expires: 3600, // 凭证有效期1小时
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)"}',
  };
  
  const putPolicy = new qiniu.rs.PutPolicy(options);
  const uploadToken = putPolicy.uploadToken(mac);
  
  return uploadToken;
}

// API 路由
app.get('/api/ancestor/qiniu-token', (req, res) => {
  const token = getUploadToken();
  
  res.json({
    token: token,
    domain: cdnDomain,
  });
});
```

## 三、前端使用说明

前端代码已经完成，会自动：
1. 调用后端接口获取上传凭证
2. 使用七牛云 SDK 上传视频到云存储
3. 上传成功后获取 CDN 加速 URL
4. 将 URL 保存到订单记录中

## 四、启用真实上传

### 方法1：使用模拟上传（当前）
- 适合开发测试阶段
- 不需要安装 qiniu-js
- 模拟上传进度和返回 URL

### 方法2：启用真实上传
1. 安装七牛云 SDK：
```bash
cd /Users/carmin/ancestor-admin-vben
pnpm add qiniu-js -w
```

2. 修改 `/playground/src/utils/qiniu.ts`，取消注释生产环境代码块

3. 后端实现上述上传凭证接口

4. 配置 CDN 域名

## 五、CDN 域名配置步骤

1. 登录七牛云控制台：https://portal.qiniu.com
2. 进入 CDN 配置页面
3. 绑定你的域名（需要已备案）
4. 配置 CNAME 记录指向七牛云
5. 等待 CDN 生效（通常几分钟）
6. 将域名更新到后端配置中

## 六、注意事项

⚠️ **安全提醒**：
- AccessKey 和 SecretKey 只能在后端使用
- 绝对不能将 AK/SK 写在前端代码中
- 上传凭证必须由后端动态生成
- 建议设置凭证过期时间（1小时）
- 可以限制上传文件大小和类型

## 七、当前状态

✅ 前端代码已完成
✅ Mock API 已创建（开发测试用）
⏳ 等待提供 AccessKey
⏳ 等待配置 CDN 域名
⏳ 需要后端实现真实的凭证生成接口

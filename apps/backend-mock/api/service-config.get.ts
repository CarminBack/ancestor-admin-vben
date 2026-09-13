export default defineEventHandler(async (event) => {
  const db = useDatabase();

  try {
    // 查询客服配置
    const result = await db.sql(
      `SELECT key, value FROM system_settings WHERE key IN (?, ?, ?, ?, ?, ?)`,
      [
        'service_name',
        'service_wechat_id',
        'service_wechat_qrcode',
        'service_phone',
        'service_work_time',
        'service_notice',
      ],
    );

    const config: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      config[row.key] = row.value;
    });

    return {
      code: 200,
      message: 'success',
      data: {
        serviceName: config.service_name || '祭祀客服',
        wechatId: config.service_wechat_id || '',
        wechatQrCode: config.service_wechat_qrcode || '',
        phone: config.service_phone || '',
        workTime: config.service_work_time || '9:00-18:00',
        notice: config.service_notice || '添加客服时请备注订单号',
      },
    };
  } catch (error: any) {
    console.error('查询客服配置失败:', error);
    return {
      code: 500,
      message: error.message || '查询客服配置失败',
      data: null,
    };
  }
});

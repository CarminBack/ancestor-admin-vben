/**
 * 系统设置获取
 * GET /api/ancestor/settings
 */
export default eventHandler(async (event) => {
  try {
    const db = event.context.db;

    // 查询所有设置
    const settings = await db
      .prepare('SELECT key, value FROM system_settings')
      .all();

    const settingsMap: Record<string, string> = {};
    (settings.results as any[])?.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    return successResponse({
      miniProgramName: settingsMap.mini_program_name || '祭祖小程序',
      customerPhone: settingsMap.customer_phone || '',
      customerWechat: settingsMap.customer_wechat || '',
      ritualServiceDesc: settingsMap.ritual_service_desc || '',
      videoRetentionDays: Number(settingsMap.video_retention_days) || 365,
    });
  } catch (error: any) {
    console.error('获取系统设置失败:', error);
    return serverErrorResponse(event, error.message || '获取系统设置失败');
  }
});

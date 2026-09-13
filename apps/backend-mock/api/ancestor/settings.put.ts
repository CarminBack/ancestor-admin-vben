/**
 * 系统设置更新
 * PUT /api/ancestor/settings
 */
export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      miniProgramName,
      customerPhone,
      customerWechat,
      ritualServiceDesc,
      videoRetentionDays,
    } = body;

    const db = event.context.db;

    const now = new Date().toISOString();

    // 更新设置（upsert）
    const settingsMap: Record<string, any> = {
      mini_program_name: miniProgramName,
      customer_phone: customerPhone,
      customer_wechat: customerWechat,
      ritual_service_desc: ritualServiceDesc,
      video_retention_days: videoRetentionDays,
    };

    for (const [key, value] of Object.entries(settingsMap)) {
      if (value !== undefined) {
        await db
          .prepare(
            `
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
        `,
          )
          .bind(key, String(value), now, String(value), now)
          .run();
      }
    }

    return successResponse('系统设置更新成功');
  } catch (error: any) {
    console.error('更新系统设置失败:', error);
    return serverErrorResponse(event, error.message || '更新系统设置失败');
  }
});

/**
 * 生成订单号
 * @param prefix 前缀 (JS=祭祀订单, SP=用品订单)
 * @returns 订单号
 */
export function generateOrderNo(prefix: 'JS' | 'SP'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `${prefix}${year}${month}${day}${hour}${minute}${second}${random}`;
}

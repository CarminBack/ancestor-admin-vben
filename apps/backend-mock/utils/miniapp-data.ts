export const ritualPackages = [
  { id: 'basic', name: '基础祭祀', description: '包含基础祭品', price: 168 },
  { id: 'sincere', name: '诚心祭祀', description: '包含丰富祭品', price: 268 },
  { id: 'respect', name: '敬亲祭祀', description: '包含全套祭品', price: 398 },
];

export const products = [
  { id: '1', name: '天地通用纸钱', description: '传统祭祀纸钱', price: 38, coverImage: 'https://picsum.photos/200/200?random=1', detailImages: [], categories: ['纸钱'], categoryCodes: ['paper'], options: [{ name: '标准装', price: 38, stock: 999 }], stock: 999, sales: 126, status: 'on_sale' },
  { id: '2', name: '黄金元宝（大）', description: '大号金元宝', price: 68, coverImage: 'https://picsum.photos/200/200?random=2', detailImages: [], categories: ['元宝'], categoryCodes: ['paper'], options: [{ name: '标准装', price: 68, stock: 500 }], stock: 500, sales: 89, status: 'on_sale' },
];

export const orders: any[] = [];
export const makeOrderNo = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

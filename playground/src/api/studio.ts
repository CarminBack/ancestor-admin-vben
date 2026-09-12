import { requestClient } from '#/api/request';

export interface ToolSection {
  name: string;
  url: string;
  enabled: boolean;
}

export interface StudioTool {
  id: number;
  name: string;
  category: string;
  tag: string;
  description: string;
  url: string;
  enabled: boolean;
  status: string;
  sections: ToolSection[];
  packagePath?: string;
}

export interface StudioUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  enabled: boolean;
  toolIds: number[];
}

export const studioApi = {
  users: () => requestClient.get<{ users: StudioUser[] }>('/admin/users'),
  createUser: (data: any) => requestClient.post('/admin/users', data),
  removeUser: (id: number) => requestClient.delete(`/admin/users/${id}`),
  categories: () => requestClient.get<{ categories: string[] }>('/admin/categories'),
  tools: () => requestClient.get<{ tools: StudioTool[] }>('/tools/all'),
  updateUser: (id: number, data: any) => requestClient.put(`/admin/users/${id}`, data),
  approveUser: (id: number) => requestClient.post(`/admin/users/${id}/approve`),
  addCategory: (name: string) => requestClient.post('/admin/categories', { name }),
  createTool: (data: Record<string, unknown>) => requestClient.post<{ id: number; tool: StudioTool }>('/admin/tools', data),
  createToolWithUpload: (data: Record<string, string | File>) => requestClient.upload<{ id: number; tool: StudioTool }>('/admin/tools/upload', data as Record<string, any> & { file: Blob | File }),
  removeCategory: (name: string) => requestClient.delete(`/admin/categories/${encodeURIComponent(name)}`),
  updateTool: (id: number, data: Partial<StudioTool>) => requestClient.put<{ tool: StudioTool }>(`/admin/tools/${id}`, data),
  removeTool: (id: number) => requestClient.delete(`/admin/tools/${id}`),
  uploadTool: (id: number, file: File) => { const form = new FormData(); form.append('file', file); return requestClient.post(`/admin/tools/${id}/upload`, form); },
};

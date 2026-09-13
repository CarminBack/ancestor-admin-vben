import { useAccessStore } from '@vben/stores';

/** 使用本地视频接口，保留原上传组件的进度事件。 */
export function uploadRitualVideo(file: File, progress?: (percent: number) => void): Promise<string> {
  if (file.size > 100 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.mp4')) return Promise.reject(new Error('请选择100MB以内的MP4视频'));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/video');
    xhr.setRequestHeader('Authorization', `Bearer ${useAccessStore().accessToken}`);
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress?.(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && result.code === 0) resolve(result.data.videoUrl);
        else reject(new Error(result.message || '视频上传失败'));
      } catch { reject(new Error('视频上传响应无效')); }
    };
    xhr.onerror = () => reject(new Error('视频上传网络异常'));
    xhr.onabort = () => reject(new Error('视频上传已取消'));
    const data = new FormData(); data.append('file', file); xhr.send(data);
  });
}

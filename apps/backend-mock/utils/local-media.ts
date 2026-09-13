import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { defineEventHandler, readMultipartFormData, getHeader, getRouterParam, getQuery, setHeader, setResponseStatus, sendStream } from 'h3';
import { localDataDir } from './local-store';
import { respond, fail, checkMedia } from './ancestor-business';
import { verifyAccessToken } from './jwt-utils';
export const uploadVideo = defineEventHandler(event => respond(event, true, async () => {
  if (Number(getHeader(event, 'content-length') || 0) > 100 * 1024 * 1024) fail('视频不能超过100MB', 413);
  const files = await readMultipartFormData(event);
  const file = files?.find(f => f.filename);
  if (!file || file.data.length > 100 * 1024 * 1024 || file.data.subarray(4, 8).toString() !== 'ftyp') fail('请上传100MB以内的MP4视频');
  const dir = resolve(localDataDir, 'media'); mkdirSync(dir, { recursive: true });
  const name = `${randomUUID()}.mp4`; writeFileSync(resolve(dir, name), file.data);
  return { videoUrl: `/api/media/${name}` };
}));
export const serveVideo = defineEventHandler(async event => {
  const name = getRouterParam(event, 'name') || '';
  const q = getQuery(event);
  if (!verifyAccessToken(event) && !checkMedia(`/api/media/${name}`, q.expires, q.sig)) { setResponseStatus(event, 403); return '视频链接无效或已过期'; }
  if (!/^[a-f0-9-]+\.mp4$/.test(name)) { setResponseStatus(event, 404); return 'Not found'; }
  const file = resolve(localDataDir, 'media', name);
  if (!existsSync(file)) { setResponseStatus(event, 404); return 'Not found'; }
  const size = statSync(file).size;
  setHeader(event, 'Content-Type', 'video/mp4'); setHeader(event, 'Accept-Ranges', 'bytes'); setHeader(event, 'Cache-Control', 'private, no-store');
  const range = getHeader(event, 'range');
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    const start = match ? Number(match[1]) : -1, end = match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start < 0 || start > end || start >= size) { setResponseStatus(event, 416); setHeader(event, 'Content-Range', `bytes */${size}`); return ''; }
    setResponseStatus(event, 206); setHeader(event, 'Content-Range', `bytes ${start}-${end}/${size}`); setHeader(event, 'Content-Length', end - start + 1);
    return sendStream(event, createReadStream(file, { start, end }));
  }
  setHeader(event, 'Content-Length', size);
  return sendStream(event, createReadStream(file));
});

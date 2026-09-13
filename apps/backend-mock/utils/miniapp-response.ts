import type { H3Event } from 'h3';

export function miniappSuccess(data: any, message = '操作成功') {
  return {
    code: 200,
    message,
    data,
  };
}

export function miniappError(message = '操作失败', code = 1) {
  return {
    code,
    message,
    data: null,
  };
}

export function miniappServerError(event: H3Event, message = '服务器错误') {
  setResponseStatus(event, 500);
  return {
    code: 500,
    message,
    data: null,
  };
}

export function miniappNotFound(event: H3Event, message = '资源不存在') {
  setResponseStatus(event, 404);
  return {
    code: 404,
    message,
    data: null,
  };
}

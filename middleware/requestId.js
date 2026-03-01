import { randomUUID } from 'crypto';

const UUID_RE = /^[0-9a-f-]{36}$/i;

export function requestId(req, _res, next) {
  const incoming = req.headers['x-request-id'];
  req.id = (incoming && UUID_RE.test(incoming)) ? incoming : randomUUID();
  next();
}

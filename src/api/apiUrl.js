const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function resolveApiUrl(configuredUrl = '', hostname = '') {
  if (!LOCAL_HOSTS.has(hostname)) {
    return '';
  }

  return configuredUrl || '';
}

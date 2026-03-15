export const normalizeImageUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl) {
    return null;
  }

  const url = rawUrl.trim();
  if (!url) {
    return null;
  }

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }

  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
      return `https://${url.slice('http://'.length)}`;
    }
    return url;
  }

  return `https://${url}`;
};

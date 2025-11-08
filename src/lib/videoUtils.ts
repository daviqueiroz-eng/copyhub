export type VideoType = 'youtube' | 'google-drive' | 'unknown';

/**
 * Detecta o tipo de URL de vídeo
 */
export function detectVideoType(url: string): VideoType {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (lowerUrl.includes('drive.google.com')) {
    return 'google-drive';
  }
  
  return 'unknown';
}

/**
 * Extrai o ID de um vídeo do YouTube
 * Suporta formatos: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\s]+)/);
  if (watchMatch) return watchMatch[1];
  
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([^?\s]+)/);
  if (shortMatch) return shortMatch[1];
  
  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^?\s]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}

/**
 * Extrai o ID de um arquivo do Google Drive
 * Suporta formatos: drive.google.com/file/d/FILE_ID, drive.google.com/open?id=FILE_ID
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  
  // drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([^/?\s]+)/);
  if (fileMatch) return fileMatch[1];
  
  // drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([^&\s]+)/);
  if (openMatch) return openMatch[1];
  
  return null;
}

/**
 * Gera URL embedável para YouTube
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Gera URL embedável para Google Drive
 */
export function getGoogleDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Função principal: gera URL embedável a partir de uma URL do YouTube ou Google Drive
 */
export function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  
  const videoType = detectVideoType(url);
  
  if (videoType === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return getYouTubeEmbedUrl(videoId);
    }
  }
  
  if (videoType === 'google-drive') {
    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      return getGoogleDriveEmbedUrl(fileId);
    }
  }
  
  // Fallback: retorna a URL original
  return url;
}

/**
 * Gera URL de thumbnail (apenas para YouTube)
 */
export function getVideoThumbnail(url: string): string | null {
  const videoType = detectVideoType(url);
  
  if (videoType === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }
  
  // Google Drive não tem thumbnails públicas
  return null;
}

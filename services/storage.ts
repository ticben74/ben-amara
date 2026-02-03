
// ═══════════════════════════════════════════════════════════════════
// STORAGE SERVICE - خدمة التخزين المتكاملة
// ═══════════════════════════════════════════════════════════════════

import { supabase } from './supabase'

// ───────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────

export type MediaType = 'audio' | 'image' | 'video' | '3d'
export type AudioSubfolder = 'stories' | 'ambient' | 'tts' | 'recordings'
export type ImageSubfolder = 'murals' | 'thumbnails' | 'artworks' | 'generated'
export type VideoSubfolder = 'doors' | 'tours'

interface UploadOptions {
  folder?: string
  onProgress?: (progress: number) => void
  maxSize?: number // in MB
  allowedTypes?: string[]
}

interface UploadResult {
  url: string
  path: string
  size: number
  type: string
}

// ───────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────

const BUCKET_NAME = 'intervention-media'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const MIME_TYPES = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/pcm'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  '3d': ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
}

// ───────────────────────────────────────────────────────────────────
// Main Upload Function
// ───────────────────────────────────────────────────────────────────

/**
 * رفع ملف إلى Supabase Storage
 */
export const uploadFile = async (
  file: File | Blob,
  mediaType: MediaType,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  if (!supabase) throw new Error("Supabase client is not initialized");

  try {
    // 1. Validation (Skip validation if it's a recorded Blob without type info sometimes)
    if (file instanceof File) {
      validateFile(file, mediaType, options)
    }

    // 2. Generate file path
    const fileName = file instanceof File ? file.name : `rec-${Date.now()}.webm`;
    const filePath = generateFilePath(fileName, mediaType, options.folder)

    // 3. Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type || (mediaType === 'audio' ? 'audio/webm' : 'application/octet-stream')
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    throw new Error(`فشل رفع الملف: ${error.message}`)
  }
}

// ───────────────────────────────────────────────────────────────────
// Specific Upload Functions
// ───────────────────────────────────────────────────────────────────

export const uploadAudio = async (file: File | Blob, subfolder: AudioSubfolder = 'stories', onProgress?: (progress: number) => void) => 
  uploadFile(file, 'audio', { folder: `audio/${subfolder}`, onProgress });

export const uploadImage = async (file: File, subfolder: ImageSubfolder = 'murals', onProgress?: (progress: number) => void) => 
  uploadFile(file, 'image', { folder: `images/${subfolder}`, onProgress });

export const uploadVideo = async (file: File, subfolder: VideoSubfolder = 'doors', onProgress?: (progress: number) => void) => 
  uploadFile(file, 'video', { folder: `videos/${subfolder}`, onProgress });

// ───────────────────────────────────────────────────────────────────
// Image Optimization
// ───────────────────────────────────────────────────────────────────

export const optimizeImage = async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          else reject(new Error('Optimization failed'));
        }, 'image/jpeg', quality);
      };
    };
  });
};

export const uploadOptimizedImage = async (file: File, subfolder: ImageSubfolder = 'murals', onProgress?: (progress: number) => void) => {
  const optimized = await optimizeImage(file);
  return uploadImage(optimized, subfolder, onProgress);
};

// ───────────────────────────────────────────────────────────────────
// Delete & Management Functions
// ───────────────────────────────────────────────────────────────────

export const deleteFile = async (url: string): Promise<void> => {
  if (!supabase) return;
  const path = extractPathFromUrl(url);
  if (!path) throw new Error('Invalid URL');
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;
};

export const listFiles = async (folder: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder);
  if (error) throw error;
  return data;
};

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

const generateFilePath = (originalName: string, mediaType: MediaType, folder?: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${timestamp}-${randomStr}-${safeName}`;
  return folder ? `${folder}/${fileName}` : `${mediaType}/${fileName}`;
};

const extractPathFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch { return null; }
};

const validateFile = (file: File, mediaType: MediaType, options: UploadOptions): void => {
  const maxSize = (options.maxSize || 50) * 1024 * 1024;
  if (file.size > maxSize) throw new Error(`الملف كبير جداً. الحد الأقصى: ${maxSize / 1024 / 1024} MB`);
  const allowedTypes = options.allowedTypes || MIME_TYPES[mediaType];
  if (!allowedTypes.includes(file.type)) throw new Error(`نوع الملف غير مدعوم.`);
};

export const base64ToFile = (base64: string, filename: string, mimeType: string = 'image/jpeg'): File => {
  const arr = base64.split(',');
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mimeType });
};

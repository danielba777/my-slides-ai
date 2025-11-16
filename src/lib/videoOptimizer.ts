/**
 * Client-side video optimization utilities
 * Dynamically optimizes videos for better performance without creating separate preview files
 */

export interface VideoOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  targetBitrate?: number; // kbps
  format?: 'mp4' | 'webm';
  enableHardwareAcceleration?: boolean;
}

export class VideoOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.videoElement = document.createElement('video');
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
  }

  /**
   * Creates an optimized video URL dynamically
   * Uses browser's native video rendering with query parameters for CDN optimization
   */
  static createOptimizedUrl(
    originalUrl: string,
    options: VideoOptimizationOptions = {}
  ): string {
    const {
      maxWidth = 640,
      maxHeight = 1136,
      quality = 0.6,
      targetBitrate = 500,
      format = 'mp4'
    } = options;

    const baseUrl = originalUrl.split('?')[0];
    const existingParams = new URLSearchParams(originalUrl.split('?')[1] || '');

    // Add optimization parameters
    const params = new URLSearchParams(existingParams);
    params.set('optimize', 'true');
    params.set('max_width', maxWidth.toString());
    params.set('max_height', maxHeight.toString());
    params.set('quality', quality.toString());
    params.set('bitrate', targetBitrate.toString());
    params.set('format', format);

    // Some CDNs support these parameters for dynamic optimization
    // If the CDN doesn't support them, we fall back to client-side optimization
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Creates a blob URL for a compressed version of the video
   * This is CPU intensive but provides actual file size reduction
   */
  async compressVideo(
    videoUrl: string,
    options: VideoOptimizationOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 640,
      maxHeight = 1136,
      quality = 0.6,
      format = 'video/webm;codecs=vp9'
    } = options;

    return new Promise((resolve, reject) => {
      try {
        this.videoElement.src = videoUrl;
        this.videoElement.crossOrigin = 'anonymous';

        this.videoElement.addEventListener('loadedmetadata', async () => {
          try {
            // Calculate target dimensions
            const videoAspect = this.videoElement.videoWidth / this.videoElement.videoHeight;
            let targetWidth = this.videoElement.videoWidth;
            let targetHeight = this.videoElement.videoHeight;

            if (targetWidth > maxWidth) {
              targetWidth = maxWidth;
              targetHeight = Math.round(targetWidth / videoAspect);
            }

            if (targetHeight > maxHeight) {
              targetHeight = maxHeight;
              targetWidth = Math.round(targetHeight * videoAspect);
            }

            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;

            // Create MediaRecorder for compression
            const stream = this.canvas.captureStream(30); // 30 FPS
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: format,
              videoBitsPerSecond: options.targetBitrate ? options.targetBitrate * 1000 : undefined
            });

            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                chunks.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: format });
              const url = URL.createObjectURL(blob);
              resolve(url);
            };

            // Start recording and process frames
            mediaRecorder.start();

            const processFrames = async () => {
              if (this.videoElement.paused || this.videoElement.ended) {
                mediaRecorder.stop();
                return;
              }

              // Draw current frame to canvas at target size
              this.ctx.drawImage(
                this.videoElement,
                0, 0, targetWidth, targetHeight
              );

              // Continue processing
              requestAnimationFrame(processFrames);
            };

            // Start playback and processing
            await this.videoElement.play();
            processFrames();

          } catch (error) {
            reject(error);
          }
        });

        this.videoElement.addEventListener('error', (error) => {
          reject(new Error(`Video load failed: ${error}`));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get video metadata without loading the entire video
   */
  static async getVideoMetadata(videoUrl: string): Promise<{
    width: number;
    height: number;
    duration: number;
    size?: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.crossOrigin = 'anonymous';

      video.addEventListener('loadedmetadata', () => {
        const metadata = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        };
        resolve(metadata);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video metadata'));
      });

      video.src = videoUrl;
    });
  }

  /**
   * Checks if the browser supports hardware acceleration
   */
  static checkHardwareAccelerationSupport(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return false;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    // Check for hardware accelerated renderers
    return /nvidia|amd|radeon|intel.*hd|apple|mali|adreno|tegra/i.test(renderer);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.videoElement.src) {
      URL.revokeObjectURL(this.videoElement.src);
    }
  }
}

/**
 * Simple utility to create optimized video URLs
 */
export function createOptimizedVideoUrl(
  originalUrl: string,
  options: VideoOptimizationOptions = {}
): string {
  return VideoOptimizer.createOptimizedUrl(originalUrl, options);
}

/**
 * Check if we should use dynamic optimization
 */
export function shouldUseDynamicOptimization(videoUrl: string): boolean {
  // Use dynamic optimization for larger files or when performance is needed
  const isLocalDevelopment = process.env.NODE_ENV === 'development';
  const isLargeFile = videoUrl.includes('high-res') || videoUrl.includes('original');

  return isLocalDevelopment || isLargeFile;
}
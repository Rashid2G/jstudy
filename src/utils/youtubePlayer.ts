// Hidden audio-only YouTube IFrame API controller for YouTube videos & live streams

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubeCallbacks {
  onPlaying?: () => void;
  onBuffering?: () => void;
  onPaused?: () => void;
  onFallbackNeeded?: (reason: string) => void;
}

class YouTubeAudioController {
  private player: any = null;
  private isReady = false;
  private apiLoadingPromise: Promise<void> | null = null;
  private currentVideoId: string | null = null;
  private desiredVolume = 75;
  private isMuted = false;
  private callbacks: YouTubeCallbacks = {};
  private pendingPlayVideoId: string | null = null;

  private loadApi(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('No window environment'));
    }
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (this.apiLoadingPromise) {
      return this.apiLoadingPromise;
    }

    this.apiLoadingPromise = new Promise<void>((resolve, reject) => {
      const prevCallback = window.onYouTubeIframeAPIReady;
      const timeout = window.setTimeout(() => {
        this.apiLoadingPromise = null;
        reject(new Error('YouTube IFrame API load timeout'));
      }, 8000);

      window.onYouTubeIframeAPIReady = () => {
        window.clearTimeout(timeout);
        if (prevCallback) prevCallback();
        resolve();
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => {
          window.clearTimeout(timeout);
          this.apiLoadingPromise = null;
          reject(new Error('Failed to load YouTube IFrame API'));
        };
        document.head.appendChild(script);
      }
    });

    return this.apiLoadingPromise;
  }

  private ensureContainer(): HTMLElement {
    let host = document.getElementById('studinty-yt-audio-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'studinty-yt-audio-host';
      host.setAttribute('aria-hidden', 'true');
      Object.assign(host.style, {
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        width: '1px',
        height: '1px',
        opacity: '0.001',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: '-1',
      });
      const target = document.createElement('div');
      target.id = 'studinty-yt-audio-player';
      host.appendChild(target);
      document.body.appendChild(host);
    }
    return host;
  }

  async play(videoId: string, volume0to1: number, muted: boolean, callbacks: YouTubeCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.desiredVolume = Math.round(Math.max(0, Math.min(1, volume0to1)) * 100);
    this.isMuted = muted;
    this.pendingPlayVideoId = videoId;

    try {
      await this.loadApi();
    } catch (err: any) {
      callbacks.onFallbackNeeded?.(err?.message || 'YouTube API blocked');
      return;
    }

    this.ensureContainer();

    if (this.player && this.isReady) {
      if (this.currentVideoId !== videoId) {
        this.currentVideoId = videoId;
        this.player.loadVideoById({ videoId, suggestedQuality: 'small' });
      } else {
        this.player.playVideo();
      }
      this.applyVolume();
      return;
    }

    if (this.player && !this.isReady) {
      // Player is still initializing; pendingPlayVideoId will trigger in onReady
      return;
    }

    this.currentVideoId = videoId;
    this.player = new window.YT.Player('studinty-yt-audio-player', {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          this.isReady = true;
          this.applyVolume();
          if (this.pendingPlayVideoId) {
            if (this.pendingPlayVideoId !== this.currentVideoId) {
              this.currentVideoId = this.pendingPlayVideoId;
              this.player.loadVideoById({ videoId: this.pendingPlayVideoId, suggestedQuality: 'small' });
            } else {
              this.player.playVideo();
            }
          }
        },
        onStateChange: (event: any) => {
          const YTState = window.YT?.PlayerState;
          if (!YTState) return;
          if (event.data === YTState.PLAYING) {
            this.applyVolume();
            this.callbacks.onPlaying?.();
          } else if (event.data === YTState.BUFFERING) {
            this.callbacks.onBuffering?.();
          } else if (event.data === YTState.PAUSED) {
            this.callbacks.onPaused?.();
          } else if (event.data === YTState.ENDED) {
            // Seamlessly loop finished study tracks
            try {
              this.player.seekTo(0, true);
              this.player.playVideo();
            } catch {
              // ignore
            }
          }
        },
        onError: (event: any) => {
          this.callbacks.onFallbackNeeded?.(`YouTube embed error ${event?.data ?? 'unknown'}`);
        },
      },
    });
  }

  pause(): void {
    this.pendingPlayVideoId = null;
    if (this.player && this.isReady) {
      try {
        this.player.pauseVideo();
      } catch {
        // ignore
      }
    }
  }

  stop(): void {
    this.pendingPlayVideoId = null;
    if (this.player && this.isReady) {
      try {
        this.player.stopVideo();
      } catch {
        // ignore
      }
    }
  }

  setVolume(volume0to1: number, muted: boolean): void {
    this.desiredVolume = Math.round(Math.max(0, Math.min(1, volume0to1)) * 100);
    this.isMuted = muted;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.player || !this.isReady) return;
    try {
      if (this.isMuted || this.desiredVolume === 0) {
        this.player.mute();
      } else {
        this.player.unMute();
        this.player.setVolume(this.desiredVolume);
      }
    } catch {
      // ignore
    }
  }
}

export const youtubeAudio = new YouTubeAudioController();

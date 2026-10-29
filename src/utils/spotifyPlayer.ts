// Spotify IFrame API Controller for Spotify tracks, playlists, albums, and episodes
// Manages an EmbedController instance allowing start, stop, pause, and track/playlist changes directly from the app.

import { extractSpotifyUri, extractSpotifyDetails } from './spotify.js';

declare global {
  interface Window {
    SpotifyIframeApi?: any;
    onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
  }
}

export interface SpotifyCallbacks {
  onPlaying?: () => void;
  onPaused?: () => void;
  onReady?: () => void;
  onError?: (error: string) => void;
}

class SpotifyAudioController {
  private controller: any = null;
  private isReady = false;
  private apiLoadingPromise: Promise<any> | null = null;
  private iframeApi: any = null;
  private currentUri: string | null = null;
  private pendingPlayUri: string | null = null;
  private callbacks: SpotifyCallbacks = {};
  private hostElement: HTMLElement | null = null;

  /**
   * Dynamically loads the Spotify iFrame API script once and resolves with the IFrameAPI object.
   */
  loadApi(): Promise<any> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('No window environment'));
    }
    if (this.iframeApi) {
      return Promise.resolve(this.iframeApi);
    }
    if (window.SpotifyIframeApi) {
      this.iframeApi = window.SpotifyIframeApi;
      return Promise.resolve(this.iframeApi);
    }
    if (this.apiLoadingPromise) {
      return this.apiLoadingPromise;
    }

    this.apiLoadingPromise = new Promise<any>((resolve, reject) => {
      const prevCallback = window.onSpotifyIframeApiReady;
      const timeout = window.setTimeout(() => {
        this.apiLoadingPromise = null;
        reject(new Error('Spotify IFrame API load timeout'));
      }, 9000);

      window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
        window.clearTimeout(timeout);
        this.iframeApi = IFrameAPI;
        window.SpotifyIframeApi = IFrameAPI;
        if (prevCallback) prevCallback(IFrameAPI);
        resolve(IFrameAPI);
      };

      const existing = document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        script.onerror = () => {
          window.clearTimeout(timeout);
          this.apiLoadingPromise = null;
          reject(new Error('Failed to load Spotify IFrame API'));
        };
        document.head.appendChild(script);
      }
    });

    return this.apiLoadingPromise;
  }

  /**
   * Ensures the persistent floating/docked host container exists in document.body.
   */
  private ensureContainer(): HTMLElement {
    if (this.hostElement && document.body.contains(this.hostElement)) {
      return this.hostElement;
    }

    let host = document.getElementById('studinty-spotify-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'studinty-spotify-host';
      host.setAttribute('role', 'region');
      host.setAttribute('aria-label', 'Spotify Focus Player');

      Object.assign(host.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        height: '152px',
        zIndex: '50',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        backgroundColor: 'var(--bg-elevated, #18181b)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
        transform: 'translateY(130%)',
        opacity: '0',
        pointerEvents: 'none',
      });

      const target = document.createElement('div');
      target.id = 'studinty-spotify-embed-slot';
      host.appendChild(target);

      document.body.appendChild(host);
    }

    this.hostElement = host;
    return host;
  }

  /**
   * Controls visual appearance of the Spotify embed without unmounting it.
   */
  setVisible(visible: boolean): void {
    const host = this.ensureContainer();
    if (visible) {
      host.style.transform = 'translateY(0)';
      host.style.opacity = '1';
      host.style.pointerEvents = 'auto';
    } else {
      host.style.transform = 'translateY(130%)';
      host.style.opacity = '0';
      host.style.pointerEvents = 'none';
    }
  }

  /**
   * Starts or resumes playback of a Spotify entity.
   */
  async play(urlOrUri: string, callbacks: SpotifyCallbacks = {}): Promise<void> {
    const uri = extractSpotifyUri(urlOrUri);
    if (!uri) {
      callbacks.onError?.('Invalid Spotify URL or URI');
      return;
    }

    this.callbacks = callbacks;
    this.pendingPlayUri = uri;
    const details = extractSpotifyDetails(urlOrUri);

    const host = this.ensureContainer();
    // Adjust height based on entity type: 80px for single tracks, 152px for playlists/albums
    const height = details?.type === 'track' ? '80' : '152';
    host.style.height = `${height}px`;

    this.setVisible(true);

    try {
      const api = await this.loadApi();

      if (this.controller && this.isReady) {
        if (this.currentUri !== uri) {
          this.currentUri = uri;
          this.controller.loadUri(uri);
        }
        this.controller.play();
        this.callbacks.onPlaying?.();
        return;
      }

      if (this.controller && !this.isReady) {
        // Already initializing; pendingPlayUri will be played once ready
        return;
      }

      this.currentUri = uri;
      const slot = document.getElementById('studinty-spotify-embed-slot');
      if (!slot) return;

      const options = {
        uri,
        width: '100%',
        height,
      };

      api.createController(slot, options, (embedController: any) => {
        this.controller = embedController;

        embedController.addListener('ready', () => {
          this.isReady = true;
          this.callbacks.onReady?.();
          if (this.pendingPlayUri) {
            if (this.pendingPlayUri !== this.currentUri) {
              this.currentUri = this.pendingPlayUri;
              this.controller.loadUri(this.pendingPlayUri);
            }
            this.controller.play();
            this.callbacks.onPlaying?.();
          }
        });

        embedController.addListener('playback_update', (event: any) => {
          const isPaused = event?.data?.isPaused;
          if (isPaused === false) {
            this.callbacks.onPlaying?.();
          } else if (isPaused === true) {
            this.callbacks.onPaused?.();
          }
        });

        embedController.addListener('error', (event: any) => {
          const msg = event?.data?.message || 'Spotify playback error';
          this.callbacks.onError?.(msg);
        });
      });
    } catch (err: any) {
      callbacks.onError?.(err?.message || 'Failed to initialize Spotify player');
    }
  }

  /**
   * Pauses the active Spotify playback.
   */
  pause(): void {
    this.pendingPlayUri = null;
    if (this.controller && this.isReady) {
      try {
        this.controller.pause();
        this.callbacks.onPaused?.();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Pauses playback and hides the floating embed.
   */
  stop(): void {
    this.pause();
    this.setVisible(false);
  }

  /**
   * Changes the active Spotify URI directly from within the app.
   */
  loadUri(urlOrUri: string): void {
    const uri = extractSpotifyUri(urlOrUri);
    if (!uri) return;

    this.pendingPlayUri = uri;
    this.currentUri = uri;

    const details = extractSpotifyDetails(urlOrUri);
    if (this.hostElement) {
      const height = details?.type === 'track' ? '80' : '152';
      this.hostElement.style.height = `${height}px`;
    }

    if (this.controller && this.isReady) {
      try {
        this.controller.loadUri(uri);
        this.controller.play();
      } catch {
        // ignore
      }
    }
  }
}

export const spotifyAudio = new SpotifyAudioController();

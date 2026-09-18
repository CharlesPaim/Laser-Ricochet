/**
 * PokiService — Defensive Poki SDK v2 Wrapper
 * Handles platform lifecycle hooks (gameLoadingFinished, gameplayStart, gameplayStop)
 * and commercial / rewarded ad breaks with robust fallback for localhost and offline testing.
 */

declare global {
  interface Window {
    PokiSDK?: {
      init: () => Promise<void>;
      gameLoadingFinished: () => void;
      gameplayStart: () => void;
      gameplayStop: () => void;
      commercialBreak: () => Promise<void>;
      rewardedBreak: () => Promise<boolean>;
      setDebug?: (debug: boolean) => void;
    };
  }
}

export class PokiService {
  private static isInitialized = false;
  private static isAdBlockerActive = false;
  private static isDevelopment = false;

  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof window === 'undefined') {
      this.isDevelopment = true;
      this.isInitialized = true;
      return;
    }

    const host = window.location.hostname;
    this.isDevelopment =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.');

    if (window.PokiSDK) {
      try {
        if (this.isDevelopment && window.PokiSDK.setDebug) {
          window.PokiSDK.setDebug(true);
        }
        await window.PokiSDK.init();
        this.isAdBlockerActive = false;
        console.log('[PokiService] PokiSDK initialized successfully.');
      } catch (err) {
        console.warn('[PokiService] PokiSDK init failed or adblock detected. Continuing with fallback:', err);
        this.isAdBlockerActive = true;
      }
    } else {
      console.log('[PokiService] PokiSDK not loaded on window. Running in mock/development mode.');
    }

    this.isInitialized = true;
  }

  public static gameLoadingFinished(): void {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameLoadingFinished();
      } catch (e) {
        console.warn('[PokiService] gameLoadingFinished error:', e);
      }
    }
  }

  public static gameplayStart(): void {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameplayStart();
      } catch (e) {
        console.warn('[PokiService] gameplayStart error:', e);
      }
    }
  }

  public static gameplayStop(): void {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameplayStop();
      } catch (e) {
        console.warn('[PokiService] gameplayStop error:', e);
      }
    }
  }

  /**
   * Triggers an interstitial commercial break.
   * Strictly invokes onBeforeAd (muting audio & freezing input),
   * calls gameplayStop(), waits for ad resolution, then invokes onAfterAd (unmuting).
   */
  public static async showCommercial(
    onBeforeAd?: () => void,
    onAfterAd?: () => void
  ): Promise<void> {
    try {
      this.gameplayStop();
      if (onBeforeAd) onBeforeAd();

      if (typeof window !== 'undefined' && window.PokiSDK) {
        await window.PokiSDK.commercialBreak();
      } else {
        // Fallback simulation for local dev
        await new Promise((res) => setTimeout(res, 60));
      }
    } catch (err) {
      console.warn('[PokiService] commercialBreak error or skipped:', err);
    } finally {
      if (onAfterAd) onAfterAd();
    }
  }

  /**
   * Triggers a rewarded video break.
   * Returns true if the reward should be granted, false otherwise.
   * Always handles audio and input lifecycle safely.
   */
  public static async showRewarded(
    onBeforeAd?: () => void,
    onAfterAd?: () => void
  ): Promise<boolean> {
    let success = false;
    try {
      this.gameplayStop();
      if (onBeforeAd) onBeforeAd();

      if (typeof window !== 'undefined' && window.PokiSDK) {
        success = await window.PokiSDK.rewardedBreak();
        if (this.isDevelopment) {
          console.log('[PokiService Dev] Running on localhost. Granting rewarded break for testing.');
          success = true;
        }
      } else {
        // In local development / mock, always grant the reward
        console.log('[PokiService Dev] Rewarded video simulated. Granting reward.');
        await new Promise((res) => setTimeout(res, 60));
        success = true;
      }
    } catch (err) {
      console.warn('[PokiService] rewardedBreak error:', err);
      success = false;
    } finally {
      if (onAfterAd) onAfterAd();
    }
    return success;
  }
}

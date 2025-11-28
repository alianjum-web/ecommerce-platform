// src/utils/warmupService.ts
class WarmupService {
  private isWarming = false;
  private lastWarmTime = 0;
  private readonly WARM_INTERVAL = 10 * 60 * 1000; // 10 minutes

  async warmBackend(): Promise<boolean> {
    // Prevent multiple simultaneous warmup calls
    if (this.isWarming) {
      return false;
    }

    this.isWarming = true;
    
    try {
      console.log("🔥 Warming up backend...");
      const startTime = Date.now();
      
      const response = await fetch('/api/warm', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Short timeout for warmup calls
        signal: AbortSignal.timeout(10000),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend warmed up in ${duration}ms:`, data.status);
        this.lastWarmTime = Date.now();
        return true;
      } else {
        console.warn('❌ Warmup request failed:', response.status);
        return false;
      }
    } catch (error) {
      console.warn('🔥 Warmup failed (expected during cold starts):', error);
      return false;
    } finally {
      this.isWarming = false;
    }
  }

  shouldWarm(): boolean {
    // Warm if never warmed before or if last warm was more than WARM_INTERVAL ago
    return Date.now() - this.lastWarmTime > this.WARM_INTERVAL;
  }

  // Call this when app starts and periodically
  async initialize(): Promise<void> {
    if (this.shouldWarm()) {
      // Don't await this - let it run in background
      this.warmBackend().catch(() => {});
    }

    // Set up periodic warming
    this.startPeriodicWarming();
  }

  private startPeriodicWarming(): void {
    if (typeof window === 'undefined') return;

    // Warm every 10 minutes
    setInterval(() => {
      if (this.shouldWarm()) {
        this.warmBackend().catch(() => {});
      }
    }, this.WARM_INTERVAL);

    // Also warm when user becomes active after being away
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.shouldWarm()) {
        this.warmBackend().catch(() => {});
      }
    });
  }

  // Call this before important actions like login
  async ensureWarm(): Promise<void> {
    if (this.shouldWarm()) {
      console.log("🔥 Ensuring backend is warm before action...");
      await this.warmBackend();
    }
  }
}

// Singleton instance
export const warmupService = new WarmupService();
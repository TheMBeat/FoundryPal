export class ChatRateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly maxPerWindow: number, private readonly windowMs: number) {}

  allow(sessionId: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(sessionId);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(sessionId, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (bucket.count >= this.maxPerWindow) {
      return false;
    }

    bucket.count += 1;
    return true;
  }
}

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limit by the REAL client IP, not the connection source.
 *
 * The api is reachable only from trusted internal services (the Next.js BFF and
 * nginx) — never directly from the internet. The BFF forwards the real visitor
 * IP as `X-Forwarded-For` (originally restored by nginx from Cloudflare's
 * `CF-Connecting-IP`, so it can't be spoofed). Without this, every request that
 * comes through the BFF shares the client container's IP and the limiter counts
 * all users as one — which both fails to stop a single attacker and throttles
 * legitimate users collectively.
 */
@Injectable()
export class ProxyThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const xff: unknown = req.headers?.['x-forwarded-for'];
    const forwarded = Array.isArray(xff)
      ? xff[0]
      : typeof xff === 'string'
        ? xff.split(',')[0]?.trim()
        : undefined;

    return Promise.resolve(forwarded || req.ip);
  }
}

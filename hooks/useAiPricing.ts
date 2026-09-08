'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_AI_PRICING,
  PRICING_OPERATIONS,
  linkedOperationPrice,
  modelDurationPriceKey,
  modelPriceKey,
} from '@/lib/ai-pricing-catalog';

export function useAiPricing() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_AI_PRICING);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) return;
    const controller = new AbortController();
    fetch(`${apiBase}/api/admin/settings/public/ai-pricing`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Pricing unavailable')))
      .then((remote) => setPrices({ ...DEFAULT_AI_PRICING, ...(remote || {}) }))
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[AI Pricing] Using safe defaults:', error?.message);
      });
    return () => controller.abort();
  }, []);

  const operationPrice = useCallback((operation: string, fallback: number, mode?: string) => {
    const exactKey = mode ? `operation:${operation}:${mode}` : '';
    const linkedOperation = PRICING_OPERATIONS.find((item) =>
      item.key === exactKey || (!exactKey && item.key === `operation:${operation}`),
    );
    if (linkedOperation?.derivedFrom) return linkedOperationPrice(linkedOperation, prices);
    return Number((exactKey && prices[exactKey] !== undefined ? prices[exactKey] : prices[`operation:${operation}`]) ?? fallback);
  }, [prices]);

  const modelPrice = useCallback((modelId: string, fallback: number) =>
    Number(prices[modelPriceKey(modelId)] ?? prices[modelId.replace(/^models\//, '')] ?? fallback), [prices]);

  const modelDurationPrice = useCallback((modelId: string, duration: number, fallback: number) =>
    Number(prices[modelDurationPriceKey(modelId, duration)] ?? fallback), [prices]);

  return { prices, operationPrice, modelPrice, modelDurationPrice };
}

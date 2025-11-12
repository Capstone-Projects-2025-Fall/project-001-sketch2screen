// frontend/src/hooks/useVariations.ts
import { useState, useCallback, useRef } from 'react';
import { VARIATION_CONFIG } from '../config/variations';
import {
  generateCacheKey,
  isCacheValid,
  createEmptyCache,
  pruneCache,
  type VariationCache,
} from '../utils/cacheUtils';

type UseVariationsResult = {
  variations: string[] | null;
  loading: boolean;
  error: string | null;
  generateAuto: (elementHtml: string, elementType: string) => Promise<void>;
  generateCustom: (elementHtml: string, elementType: string, prompt: string) => Promise<void>;
  clearCache: () => void;
};

/**
 * Hook for managing AI-generated component variations
 * Handles API calls, caching, and state management
 */
export function useVariations(): UseVariationsResult {
  const [variations, setVariations] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<VariationCache>(createEmptyCache());

  /**
   * Calls the backend API to generate variations
   */
  const callAPI = useCallback(async (
    elementHtml: string,
    elementType: string,
    customPrompt?: string
  ): Promise<string[]> => {
    const response = await fetch(VARIATION_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element_html: elementHtml,
        element_type: elementType,
        prompt: customPrompt || null,
        count: VARIATION_CONFIG.COUNT,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate variations');
    }

    const data = await response.json();
    return data.variations || [];
  }, []);

  /**
   * Generates automatic (default) variations
   */
  const generateAuto = useCallback(async (
    elementHtml: string,
    elementType: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = generateCacheKey(elementHtml);
      const cached = cacheRef.current.auto[cacheKey];

      // Check cache first
      if (cached && isCacheValid(cached.timestamp, VARIATION_CONFIG.AUTO_CACHE_DURATION)) {
        console.log('Using cached auto variations');
        setVariations(cached.variations);
        setLoading(false);
        return;
      }

      // Call API
      console.log('Generating new auto variations');
      const newVariations = await callAPI(elementHtml, elementType);

      // Update cache
      cacheRef.current.auto[cacheKey] = {
        variations: newVariations,
        timestamp: Date.now(),
      };

      // Prune cache if needed
      cacheRef.current = pruneCache(cacheRef.current, VARIATION_CONFIG.MAX_CACHE_SIZE);

      setVariations(newVariations);
    } catch (err) {
      console.error('Error generating auto variations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVariations(null);
    } finally {
      setLoading(false);
    }
  }, [callAPI]);

  /**
   * Generates custom variations based on user prompt
   */
  const generateCustom = useCallback(async (
    elementHtml: string,
    elementType: string,
    prompt: string
  ) => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cacheKey = generateCacheKey(elementHtml);
      const cached = cacheRef.current.custom[cacheKey]?.[prompt];

      // Check cache first
      if (cached && isCacheValid(cached.timestamp, VARIATION_CONFIG.CUSTOM_CACHE_DURATION)) {
        console.log('Using cached custom variations');
        setVariations(cached.variations);
        setLoading(false);
        return;
      }

      // Call API with prompt
      console.log('Generating new custom variations with prompt:', prompt);
      const newVariations = await callAPI(elementHtml, elementType, prompt);

      // Update cache
      if (!cacheRef.current.custom[cacheKey]) {
        cacheRef.current.custom[cacheKey] = {};
      }
      cacheRef.current.custom[cacheKey][prompt] = {
        variations: newVariations,
        timestamp: Date.now(),
      };

      setVariations(newVariations);
    } catch (err) {
      console.error('Error generating custom variations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVariations(null);
    } finally {
      setLoading(false);
    }
  }, [callAPI]);

  /**
   * Clears all cached variations
   */
  const clearCache = useCallback(() => {
    cacheRef.current = createEmptyCache();
    console.log('Variation cache cleared');
  }, []);

  return {
    variations,
    loading,
    error,
    generateAuto,
    generateCustom,
    clearCache,
  };
}
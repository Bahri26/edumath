import { afterEach, expect, it, vi } from 'vitest';
import { apiErrorNotifier, registerApiErrorNotifier } from './apiErrorNotifier.js';

afterEach(() => registerApiErrorNotifier(null));

it('forwards API errors to the registered toast and removes it on cleanup', () => {
  const toast = vi.fn();
  const cleanup = registerApiErrorNotifier(toast);
  apiErrorNotifier('Sunucu hatası', 'error');
  expect(toast).toHaveBeenCalledWith('Sunucu hatası', 'error');
  cleanup();
  expect(apiErrorNotifier).toBeNull();
});

it('an old provider cleanup does not remove the current notifier', () => {
  const cleanup = registerApiErrorNotifier(vi.fn());
  const current = vi.fn();
  registerApiErrorNotifier(current);
  cleanup();
  expect(apiErrorNotifier).toBe(current);
});

it('the API interceptor uses the same notification bridge as the provider', async () => {
  const { default: apiClient, registerApiErrorNotifier: compatibilityExport } = await import('./api.js');
  expect(compatibilityExport).toBe(registerApiErrorNotifier);
  const toast = vi.fn();
  registerApiErrorNotifier(toast);
  await expect(apiClient.get('/notifier-test', {
    adapter: async config => {
      throw Object.assign(new Error('Test error'), { config, response: { status: 400, data: { message: 'Geçersiz seçim' } } });
    },
  })).rejects.toThrow('Test error');
  expect(toast).toHaveBeenCalledWith('Geçersiz seçim', 'error');
});

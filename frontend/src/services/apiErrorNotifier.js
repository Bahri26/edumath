// Shared notification bridge between the API client and the React provider.
export let apiErrorNotifier = null;

export function registerApiErrorNotifier(notifier) {
  const registered = typeof notifier === 'function' ? notifier : null;
  apiErrorNotifier = registered;
  return () => {
    if (apiErrorNotifier === registered) apiErrorNotifier = null;
  };
}

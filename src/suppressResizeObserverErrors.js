/**
 * Chrome quirk: ResizeObserver can log "loop completed with undelivered notifications".
 * CRA's dev overlay treats it as fatal. Load this module before any other app imports.
 */
const isBenignResizeObserverMessage = (message) =>
  typeof message === 'string' &&
  (message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded'));

window.addEventListener(
  'error',
  (event) => {
    if (isBenignResizeObserverMessage(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

window.addEventListener(
  'unhandledrejection',
  (event) => {
    const msg = event.reason?.message ?? event.reason;
    if (isBenignResizeObserverMessage(String(msg))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

if (typeof console !== 'undefined' && typeof console.error === 'function') {
  const orig = console.error;
  console.error = (...args) => {
    if (
      args.length &&
      (isBenignResizeObserverMessage(String(args[0])) ||
        (args[0]?.message && isBenignResizeObserverMessage(String(args[0].message))))
    ) {
      return;
    }
    orig.apply(console, args);
  };
}

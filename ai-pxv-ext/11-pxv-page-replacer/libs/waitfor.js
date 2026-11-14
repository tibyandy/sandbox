function waitFor(selector, { timeout = 60000, root = document.body } = {}) {
  return new Promise((resolve, reject) => {
    // Fast path: already in the DOM
    const existing = root.querySelector(selector);
    if (existing) return resolve(existing);

    let timer;
    let observer;

    const cleanup = () => {
      clearTimeout(timer);
      observer?.disconnect();
    }

    if (timeout)
      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`waitFor: "${selector}" not found within ${timeout}ms`));
      }, timeout);

    observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        cleanup();
        resolve(el);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  });
}
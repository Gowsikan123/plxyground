/**
 * debounce — delays invoking fn until after wait ms have elapsed
 * since the last invocation.
 */
export function debounce(fn, wait = 300) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

import { DEFAULT_OPTIONS } from '../constants/common.const';

// Copy keys from the source into the target
function copyKeys(target: { [key: string]: any }, source: { [key: string]: any }) {
  if (target && source) {
    Object.keys(source).forEach((key) => {
      target[key] = source[key];
    });
  }
}

// We need to safely merge options from the defaults. This will make
// sure settings like edgeOffset are properly assigned.
export function mergeDefaultOptions(opts: { [key: string]: any }) {
  const copy: { [key: string]: any } = {};
  copyKeys(copy, DEFAULT_OPTIONS);
  copyKeys(copy, opts);
  Object.keys(DEFAULT_OPTIONS).forEach((key) => {
    const obj = DEFAULT_OPTIONS[key];
    if (typeof obj === 'object') {
      const objCopy = {};
      copyKeys(objCopy, obj);
      copyKeys(objCopy, copy[key]);
      copy[key] = objCopy;
    }
  });
  return copy;
}

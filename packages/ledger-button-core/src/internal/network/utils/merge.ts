type Obj = Record<string, any>;

export function merge(target: Obj, ...sources: Obj[]): Obj {
  if (sources.length === 0) {
    return target;
  }

  Object.entries(sources.shift() || []).forEach(([key, value]) => {
    if (value !== null) {
      if (typeof target[key] !== "object" || target[key] === null) {
        Object.assign(target, { [key]: {} });
      }

      if (
        (Array.isArray(value) &&
          value.find((item) => item.constructor === Object)) ||
        value.constructor === Object
      ) {
        merge(target[key], value);
      } else if (Array.isArray(value)) {
        Object.assign(target, {
          [key]: value.find((item: any) => Array.isArray(item))
            ? target[key].concat(value)
            : [...new Set([...target[key], ...value])],
        });
      } else {
        Object.assign(target, { [key]: value });
      }
    }
  });

  return target;
}

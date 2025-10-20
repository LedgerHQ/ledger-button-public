type Obj = Record<string, unknown>;

export function merge(target: Obj, ...sources: Obj[]): Obj {
  if (sources.length === 0) {
    return target;
  }

  Object.entries(sources.shift() || []).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (typeof target[key] !== "object" || target[key] === null) {
        Object.assign(target, { [key]: {} });
      }

      if (
        (Array.isArray(value) &&
          value.find((item) => item?.constructor === Object)) ||
        value?.constructor === Object
      ) {
        merge(target[key] as Obj, value as Obj);
      } else if (Array.isArray(value)) {
        Object.assign(target, {
          [key]: value.find((item: unknown) => Array.isArray(item))
            ? (target[key] as unknown[]).concat(value)
            : [...new Set([...(target[key] as unknown[]), ...value])],
        });
      } else {
        Object.assign(target, { [key]: value });
      }
    }
  });

  return target;
}

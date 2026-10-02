/**
 * Vitest 5 no longer treats arrow `mockImplementation(() => instance)` as a
 * constructable class. Use this when the production code calls `new Foo()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocked constructors accept any args
type AnyConstructor<T> = new (...args: any[]) => T;

export function mockConstructable<T>(instance: T): AnyConstructor<T> {
  return function ConstructableMock(): T {
    return instance;
  } as unknown as AnyConstructor<T>;
}

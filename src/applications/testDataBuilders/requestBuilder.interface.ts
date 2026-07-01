/**
 * Interface Segregation Principle (ISP): every test data builder exposes
 * exactly one method, build(). Tests that only need the finished payload
 * depend on this, never on a builder's fluent setter methods.
 */
export interface RequestBuilder<T> {
    build(): T;
}

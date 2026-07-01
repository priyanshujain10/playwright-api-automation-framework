/**
 * Dependency Inversion Principle (DIP): TestReporter (the high-level facade
 * used by tests/controllers) depends on this abstraction, never on the
 * concrete Allure or Winston SDKs directly. New sinks (e.g. Slack, TestRail)
 * are added by implementing this interface, with zero changes to callers.
 *
 * Interface Segregation Principle (ISP): kept to the two operations every
 * sink actually needs, instead of one bloated "Reporter" interface.
 */
export interface ReportingAdapter {
    log(message: string, meta?: Record<string, unknown>): void | Promise<void>;
    attach(name: string, content: string | Buffer, contentType: string): void | Promise<void>;
}

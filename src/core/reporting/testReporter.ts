import { ReportingAdapter } from "./reportingAdapter.interface";

/**
 * Dependency Inversion Principle (DIP): depends only on ReportingAdapter[],
 * the abstraction — never imports Winston or allure-js-commons directly.
 * Callers wire concrete adapters (AllureReportingAdapter, WinstonReportingAdapter,
 * or both) at construction time; TestReporter itself is unaware of the choice.
 */
export class TestReporter {
    constructor(private readonly adapters: ReportingAdapter[]) {}

    async log(message: string, meta?: Record<string, unknown>): Promise<void> {
        await Promise.all(this.adapters.map((adapter) => adapter.log(message, meta)));
    }

    async attach(name: string, content: string | Buffer, contentType: string): Promise<void> {
        await Promise.all(this.adapters.map((adapter) => adapter.attach(name, content, contentType)));
    }
}

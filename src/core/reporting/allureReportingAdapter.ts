import { attachment, logStep } from "allure-js-commons";
import { ReportingAdapter } from "./reportingAdapter.interface";

/**
 * Adapts allure-js-commons (the runtime already consumed by the
 * allure-playwright reporter configured in playwright.config.ts) to the
 * ReportingAdapter contract, so Allure-specific APIs never leak into tests.
 */
export class AllureReportingAdapter implements ReportingAdapter {
    async log(message: string, meta?: Record<string, unknown>): Promise<void> {
        await logStep(meta ? `${message} ${JSON.stringify(meta)}` : message);
    }

    async attach(name: string, content: string | Buffer, contentType: string): Promise<void> {
        await attachment(name, content, contentType);
    }
}

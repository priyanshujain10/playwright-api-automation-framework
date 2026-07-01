import { logger } from "../utils/loggingUtil/logger";
import { ReportingAdapter } from "./reportingAdapter.interface";

/**
 * Adapts the existing Winston logger to the ReportingAdapter contract.
 * Attachments are logged as metadata since Winston has no attachment concept.
 */
export class WinstonReportingAdapter implements ReportingAdapter {
    log(message: string, meta?: Record<string, unknown>): void {
        logger.info(message, meta);
    }

    attach(name: string, content: string | Buffer, contentType: string): void {
        logger.info(`attachment: ${name}`, { contentType, size: content.length });
    }
}

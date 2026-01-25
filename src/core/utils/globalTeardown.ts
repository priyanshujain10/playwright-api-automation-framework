import { logger } from "./loggingUtil/logger";
import fs from "fs";
import path from "path";

/**
 * Performs global teardown operations for the test suite.
 * Cleans up authentication storage and logs the process.
 */
async function globalTeardown() {
    logger.info(`=== Global Teardown Starting ===`);

    try {
        await cleanupAuthStorage();
        logger.info(`=== Global Teardown Complete ===`);
    } catch (error) {
        logger.error(`Error during global teardown: ${error}`);
    }
}

/**
 * Cleans up storageState.json files from test result directories.
 * Scans the test-results folder and removes any storageState.json files found in subdirectories.
 */
async function cleanupAuthStorage() {
    const testResultsDir = path.join(process.cwd(), "reports/test-results");

    if (!fs.existsSync(testResultsDir)) {
        logger.warn(`Test results directory does not exist: ${testResultsDir}`);
        return;
    }

    logger.info('Scanning for storageState.json files to clean up in: ' + testResultsDir);

    let filesDeleted = 0;

    try {
        const allDir = fs.readdirSync(testResultsDir, { withFileTypes: true });

        for (const file of allDir) {
            if (file.isDirectory()) {
                const storageStatePath = path.join(testResultsDir, file.name, "storageState.json");
                if (fs.existsSync(storageStatePath)) {
                    try {
                        fs.unlinkSync(storageStatePath);
                    logger.info(`Deleted: ${storageStatePath}`);
                    filesDeleted++;
                    } catch (err) {
                        logger.error(`Failed to delete ${storageStatePath}: ${err}`);
                    }
                }
            }
        }

        logger.info(`Cleanup completed. Deleted ${filesDeleted} storageState.json files.`);

    } catch (error) {
        logger.error(`Error during cleanup: ${error}`);
    }
}

export default globalTeardown;
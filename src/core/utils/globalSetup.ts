import { FullConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { logger } from "./loggingUtil/logger";
import fs from "fs";

async function globalSetup(_config: FullConfig) {
    const targetEnv = process.env.TARGET_ENV || process.env.test_env || "qa";

    logger.info(`=== Global Setup Starting ===`);
    logger.info(`TARGET_ENV: ${targetEnv}`);

    // Load base .env file
    const baseEnvPath = path.resolve(".env");
    if (fs.existsSync(baseEnvPath)) {
        dotenv.config({ path: baseEnvPath });
        logger.info(`Loaded base environment from: ${baseEnvPath}`);
    }

    // Load environment-specific file
    const envFilePath = path.resolve(`env/.env.${targetEnv}`);
    if (fs.existsSync(envFilePath)) {
        dotenv.config({ path: envFilePath, override: true });
        logger.info(`Loaded environment from: ${envFilePath}`);
    } else {
        logger.warn(`Environment file not found: ${envFilePath}`);
    }

    // Load local overrides
    const localEnvPath = path.resolve(`env/.env.local`);
    if (fs.existsSync(localEnvPath)) {
        dotenv.config({ path: localEnvPath, override: true });
        logger.info(`Loaded local overrides from: ${localEnvPath}`);
    }

    logger.info(`=== Global Setup Complete ===`);
}

export default globalSetup;
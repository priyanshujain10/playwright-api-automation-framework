/* eslint-disable playwright/no-conditional-in-test -- guard-clause validation of setup preconditions, not conditional assertions */
import { test } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";
import fs from "fs";

/**
 * Authentication Setup — API-based
 *
 * Executes once per test run (setup project dependency).
 * Calls POST /auth/login to obtain a JWT access token and persists it so
 * that all dependent test projects receive an authenticated APIRequestContext
 * without repeating the login flow per test.
 *
 * Token persistence strategy:
 *   1. process.env.API_TOKEN  — immediately available to all subsequent
 *      tests in the same worker process via APIBase.getDefaultHeaders().
 *   2. storageState.json      — picked up by storageState.util.ts and
 *      surfaced to Playwright's request context for dependent projects.
 */

const email    = process.env.TEST_USER_EMAIL    ?? process.env.USERNAME ?? "";
const password = process.env.TEST_USER_PASSWORD ?? process.env.PASSWORD ?? "";

test.describe("Authentication Setup", { tag: ["@Setup", "@Auth"] }, () => {

    test("Obtain JWT access token via POST /auth/login and persist session state",
        async ({ userController }, testInfo) => {

        const storageStatePath = testInfo.outputPath("storageState.json");

        logger.info("=== API Authentication Setup Starting ===");

        if (!email || !password) {
            throw new Error(
                "Credentials not configured. Set TEST_USER_EMAIL and TEST_USER_PASSWORD " +
                "in your env/.env.<environment> file or as CI secrets."
            );
        }

        logger.info(`Authenticating as: ${email}`);

        const response = await userController.login({ email, password });
        const body     = await response.json();

        if (!response.ok()) {
            throw new Error(
                `Login failed [HTTP ${response.status()}]: ` +
                `${body.error?.message ?? "No error message returned by /auth/login"}`
            );
        }

        // Support both `accessToken` (OAuth2 / JWT standard) and legacy `token` field names.
        const accessToken: string = body.data?.accessToken ?? body.data?.token;
        if (!accessToken) {
            throw new Error(
                "POST /auth/login succeeded but returned no access token. " +
                "Expected body.data.accessToken — verify the /auth/login response contract."
            );
        }

        // Make token available to APIBase.getDefaultHeaders() for all subsequent requests.
        process.env.API_TOKEN = accessToken;

        // Persist session metadata to storageState so storageState.util.ts can
        // forward the token to Playwright's APIRequestContext for dependent projects.
        const sessionState = {
            accessToken,
            refreshToken : body.data?.refreshToken  ?? null,
            expiresAt    : body.data?.expiresAt      ?? null,
            userId       : body.data?.userId         ?? null,
            capturedAt   : new Date().toISOString(),
        };

        fs.writeFileSync(storageStatePath, JSON.stringify(sessionState, null, 2));

        logger.info(`Session state persisted to: ${storageStatePath}`);
        logger.info(`Authenticated as userId=${sessionState.userId}`);
        logger.info("=== API Authentication Setup Complete ===");
    });
});
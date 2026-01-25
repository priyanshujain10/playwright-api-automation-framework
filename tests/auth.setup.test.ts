import { test } from "@core/fixtures/main.fixture";
import { logger } from "@src/core/utils/loggingUtil/logger";
import fs from "fs";

const url = process.env.SWAGGER_URL;
const username = process.env.USERNAME || "";
const password = process.env.PASSWORD || "";

test.describe('Authentication Setup', () => {
    test('Login, authenticate and set up user session', async ({ loginPage}, testInfo) => {
        const storageStatePath = testInfo.outputPath('storageState.json');

        logger.info('Starting authentication setup for URL' + url);
        logger.info('Saving storage state to: ' + storageStatePath);
        logger.info('Using username: ' + username);

        await loginPage.navigateTo(url ?? '');
        await loginPage.login(username, password);
        await loginPage.page.waitForLoadState('domcontentloaded');

        const storageState = await loginPage.page.context().storageState();

        fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));
        logger.info('Authentication setup complete. Storage state saved to: ' + storageStatePath);
    });
});
import {test as baseTest} from "@playwright/test";
import {LoginPage} from "../login.page";

export type PageFixtures = {
    loginPage: LoginPage;
};

export const test = baseTest.extend<PageFixtures>({
    loginPage: async ({page}, use) => {
        await use(new LoginPage(page));
    },
});

export {expect} from '@playwright/test';
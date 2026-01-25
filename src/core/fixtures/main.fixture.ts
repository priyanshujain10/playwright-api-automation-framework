import {test as apiFixtures} from "@applications/controllers/helper/controller.fixture";
import {test as pageFixtures} from "@src/applications/pages/helper/page.fixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(apiFixtures, pageFixtures);

export {expect} from '@playwright/test';
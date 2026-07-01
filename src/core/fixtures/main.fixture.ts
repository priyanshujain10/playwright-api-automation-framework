import {test as apiFixtures} from "@applications/controllers/helper/controller.fixture";
import {test as uiApiSyncFixtures} from "@src/applications/pages/uiApiSync/uiApiSync.fixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(apiFixtures, uiApiSyncFixtures);

export {expect} from '@playwright/test';
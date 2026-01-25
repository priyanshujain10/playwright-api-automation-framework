import { Fixtures, PlaywrightTestConfig, devices } from "@playwright/test";
import {
  ACTION_TIMEOUT,
  EXPECT_TIMEOUT,
  MAX_TIMEOUT,
} from "./src/core/constants/timeout.constant";
import { logger } from "@src/core/utils/loggingUtil/logger";
import { getStorageStateConfig } from "@src/core/utils/storageState.util";

const browserName = (process.env.BROWSER || "chrome").toLowerCase();

function setDeviceConfig(browser: string) {
  logger.info(`Setting device configuration for browser: ${browser}`);
  switch (browser) {
    case "firefox":
      return { ...devices["Desktop Firefox"] };
    case "webkit":
      return { ...devices["Desktop Safari"] };
    case "chrome":
    default:
      return { ...devices["Desktop Chrome"] };
  }
}

const use: Fixtures = {
  ...setDeviceConfig(browserName),
  viewport: { width: 1920, height: 1200 },
};

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  outputDir: "./reports/test-results",

  use: {
    screenshot: "only-on-failure",
    video: process.env.CI ? "off" : "retain-on-failure",
    actionTimeout: ACTION_TIMEOUT,
    trace: "retain-on-failure",
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },

  expect: {
    timeout: EXPECT_TIMEOUT,
  },

  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  timeout: MAX_TIMEOUT,

  globalSetup: "src/core/utils/globalSetup.ts",
  globalTeardown: "src/core/utils/globalTeardown.ts",

  reporter: [
    ["html", { open: "never", outputFolder: "reports/html-report" }],
    ["line"],
    [
      "allure-playwright",
      {
        detail: true,
        resultsDir: "reports/allure-results",
        environmentInfo: {
          NODE_VERSION: process.version,
          OS: process.platform,
          ENVIRONMENT: process.env.TARGET_ENV || "dev",
        },
      },
    ],
    ["junit", { outputFile: "reports/test-results/junit-results.xml" }],
  ],

  projects: [
    {
      name: "setup",
      testDir: "./tests/",
      testMatch: /.*\.setup\.ts/,
      use: { ...use },
    },
    {
      name: "default",
      use: { ...use,
      storageState: getStorageStateConfig(),
       },
      dependencies: ["setup"],
    },
    {
      name: "ecommerce-api",
      testDir: "./tests/",
      use: { ...use },
      dependencies: ["setup"],
    },
    {
      name: "api-smoke-tests",
      testDir: "./tests/",
      grep: /@Smoke/,
      use: { ...use },
      dependencies: ["setup"],
    },
    {
      name: "api-regression-tests",
      testDir: "./tests/",
      grep: /@Regression/,
      use: { ...use },
      dependencies: ["setup"],
    },
  ],
};

export default config;

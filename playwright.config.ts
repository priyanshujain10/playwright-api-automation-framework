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
    // ignoreHTTPSErrors is intentionally enabled for the dev/staging environments only.
    // The env/.env.<environment> file controls TARGET_ENV; production targets must
    // never set this flag — TLS validation is enforced by the staging gateway config.
    ignoreHTTPSErrors: process.env.TARGET_ENV !== "production",
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
    // ─── Auth Setup (prerequisite for all API projects) ──────────────────────
    {
      name: "setup",
      testDir: "./tests/",
      testMatch: /.*\.setup\.ts/,
      use: { ...use },
    },
    // ─── Full API Suite (all tests, default run target) ───────────────────────
    {
      name: "flipkart-api",
      testDir: "./tests/",
      testIgnore: /uiApiSync/,
      use: { ...use, storageState: getStorageStateConfig() },
      dependencies: ["setup"],
    },
    // ─── Smoke: fast pre-deployment health check (<8 min) ────────────────────
    {
      name: "api-smoke",
      testDir: "./tests/",
      testIgnore: /uiApiSync/,
      grep: /@Smoke/,
      use: { ...use },
      dependencies: ["setup"],
    },
    // ─── Regression: full release-gate suite ─────────────────────────────────
    {
      name: "api-regression",
      testDir: "./tests/",
      testIgnore: /uiApiSync/,
      grep: /@Regression/,
      use: { ...use },
      dependencies: ["setup"],
    },
    // ─── UI-API Synergy demo: live browser + live public API, no fictional
    //     backend/auth dependency ─────────────────────────────────────────────
    {
      name: "ui-api-sync",
      testDir: "./tests/uiApiSync",
      use: { ...use },
    },
  ],
};

export default config;

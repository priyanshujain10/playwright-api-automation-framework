# 🚀 Playwright API Automation Framework

<div align="center">

![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Allure](https://img.shields.io/badge/Allure-2E8B57?style=for-the-badge&logo=allure&logoColor=white)

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Installation](#-installation)
- [🏃 Usage](#-usage)
- [📊 Reporting](#-reporting)
- [🔧 Configuration](#-configuration)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Overview

A robust, scalable API test automation framework for e-commerce applications built with **Playwright** and **TypeScript**. This framework implements industry-standard design patterns including the **Controller Pattern** (adapted from Page Object Model) to ensure maximum maintainability, type safety, and reusability.

Perfect for testing RESTful APIs with comprehensive coverage of CRUD operations, authentication, and complex business workflows.

> **Scope note:** The Flipkart-domain controllers/tests (`product`, `cart`, `order`, `payment`,
> `user`, `inventory`) target a fictional backend and exist to demonstrate architecture, design
> patterns, and test technique coverage — verified via type-checking and linting, not live
> execution. The `uiApiSync` module (see below) is the one part of this repo that runs against a
> real, live, public API + UI, and is included specifically to demonstrate how API calls can
> ground and de-flake UI assertions.

---

## 🎯 Features

### 🔧 Core Capabilities
- ✅ **Full API Testing Coverage** - GET, POST, PUT, DELETE operations
- ✅ **Type-Safe Development** - Complete TypeScript support with strict typing
- ✅ **Schema Validation** - JSON schema validation for API responses
- ✅ **Authentication Handling** - Built-in auth setup and token management
- ✅ **Parallel Test Execution** - Optimized for CI/CD pipelines
- ✅ **Cross-Environment Support** - Easy switching between dev, staging, prod

### 📈 Testing & Quality
- ✅ **Comprehensive Test Suites** - Product, Cart, Order, Payment, User management
- ✅ **Tag-Based Test Organization** - @Smoke, @Regression, @API tags
- ✅ **Data-Driven Testing** - JSON-based test data management
- ✅ **Custom Assertions** - Enhanced expect utilities
- ✅ **Error Handling** - Robust error scenarios and edge cases

### 📊 Reporting & Monitoring
- ✅ **Allure Reports** - Beautiful, interactive test reports
- ✅ **HTML Reports** - Playwright's native HTML reporting
- ✅ **JUnit XML** - CI/CD integration support
- ✅ **Advanced Logging** - Structured logging with Winston
- ✅ **Screenshots & Videos** - Visual debugging on failures

### 🏗️ Architecture
- ✅ **Controller Pattern** - Clean separation of concerns
- ✅ **Fixture-Based Setup** - Reusable test fixtures
- ✅ **Utility Libraries** - Helper functions and utilities
- ✅ **Modular Design** - Easy to extend and maintain

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Playwright](https://img.shields.io/badge/-45ba4b?style=flat&logo=playwright&logoColor=white) | ^1.58.0 | API Testing Framework |
| ![TypeScript](https://img.shields.io/badge/-007ACC?style=flat&logo=typescript&logoColor=white) | ^5.0.0 | Type Safety & Development |
| ![Node.js](https://img.shields.io/badge/-43853D?style=flat&logo=node.js&logoColor=white) | >=18.0.0 | Runtime Environment |
| ![Allure](https://img.shields.io/badge/-2E8B57?style=flat&logo=allure&logoColor=white) | ^2.36.0 | Test Reporting |
| ![ESLint](https://img.shields.io/badge/-4B32C3?style=flat&logo=eslint&logoColor=white) | ^9.39.2 | Code Quality |

---

## 📁 Project Structure

```
playwright-api-automation-framework/
├── 📁 src/
│   ├── 📁 applications/
│   │   ├── 📁 controllers/          # API Controllers (Controller Pattern)
│   │   │   ├── cart.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── uiApiSync/          # Client for the live public demo API (see below)
│   │   │   └── ...
│   │   └── 📁 pages/
│   │       └── uiApiSync/          # Page Object for the UI-API synergy demo
│   ├── 📁 core/
│   │   ├── 📁 base/                # Base classes
│   │   ├── 📁 fixtures/            # Test fixtures
│   │   ├── 📁 helpers/             # Helper utilities
│   │   └── 📁 utils/               # Core utilities
│   └── 📁 models/                  # Type definitions
├── 📁 tests/                       # Test specifications
│   ├── 📁 auth.setup.test.ts       # Authentication setup
│   ├── 📁 cart/                    # Cart-related tests
│   ├── 📁 product/                 # Product API tests
│   └── 📁 ...
├── 📁 testdata/                    # Test data & schemas
│   ├── 📁 json/
│   │   ├── 📁 expectedSchemas/     # JSON schemas
│   │   ├── 📁 requests/            # Request payloads
│   │   └── 📁 responses/           # Expected responses
├── 📁 reports/                     # Test reports & results
├── 📁 env/                         # Environment configurations
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.js               # Linting configuration
└── package.json                    # Dependencies & scripts
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshujain10/playwright-api-automation-framework.git
   cd playwright-api-automation-framework
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (if needed)
   ```bash
   npx playwright install
   ```

4. **Configure environment**
   ```bash
   # Copy and update environment variables
   cp .env.example .env
   # Edit .env with your API endpoints and credentials
   ```

---

## 🏃 Usage

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api          # All API tests
npm run test:smoke        # Smoke tests only
npm run test:regression   # Regression tests only
npm run test:product      # Product-specific tests
npm run test:cart         # Cart-specific tests
npm run test:order        # Order-specific tests

# Run with specific environment
cross-env TARGET_ENV=staging npm test
```

### Development Commands

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run pretest
```

### Example Test Execution

```typescript
// Example: Get all products test
test('[GET] Verify get all products returns 200', {
  tag: ["@Smoke", "@API", "@GetAllProducts"]
}, async ({ productController }) => {
  const response = await productController.getAllProducts();
  expect(response.status()).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.success).toBe(true);
  expect(responseBody.data).toBeInstanceOf(Array);
});
```

---

## 📊 Reporting

### Allure Reports
```bash
# Generate Allure report
npm run allure:generate

# Open Allure report in browser
npm run allure:open

# Serve Allure report
npm run allure:serve
```

### HTML Reports
```bash
# Show Playwright HTML report
npm run show:report
```

### Report Features
- 📈 **Test Execution Timeline**
- 🏷️ **Tag-Based Filtering**
- 📸 **Screenshots on Failure**
- 🎥 **Video Recording**
- 📋 **Step-by-Step Execution**
- 📊 **Historical Trends**

---

## 🔧 Configuration

### Playwright Configuration
- **Parallel Execution**: Configured for CI/CD
- **Timeout Management**: Custom timeouts for actions and expectations
- **Browser Support**: Chrome, Firefox, Safari
- **Retry Logic**: Automatic retries on failure
- **Global Setup/Teardown**: Authentication and cleanup

### Environment Variables
```bash
# Required environment variables
TARGET_ENV=dev|staging|prod
TARGET_USER=your-username
TARGET_PASSWORD=your-password
BROWSER=chrome|firefox|webkit
```

### Logging Configuration
- **File Logging**: Rotating log files
- **Console Logging**: Real-time test output
- **Log Levels**: ERROR, WARN, INFO, DEBUG

---

## 🔗 API Tests Supporting UI Tests

E2E/UI suites are the slowest and flakiest layer of a test pyramid — every extra DOM assertion is
another chance for copy changes, timing, or unrelated UI bugs to fail a test that has nothing to
do with what it's meant to verify. This framework includes a small, live, runnable example of a
pattern that reduces that risk: **use the API as the source of truth for what a UI assertion
should expect, instead of hardcoding it.**

See `tests/uiApiSync/productCatalog.uiApiSync.test.ts`:

1. `exerciseProductsController.searchProduct(term)` calls the real product-search API and treats
   the response as ground truth.
2. `productsPage` (a Page Object) drives a real browser to the same search.
3. The test asserts the **UI renders what the API returned** — not a fixed expected string.

Benefits over a UI-only test:
- If the catalog data changes, the test doesn't need updating — it stays correct because it
  reads its own expectations from the API on every run.
- Business-rule bugs (wrong price, wrong name) are caught the same way regardless of whether the
  UI or the backend introduced them.
- The API call is fast and reliable; only the minimum necessary interaction is left to the
  (slower, less deterministic) browser layer.

Run it directly against the live target:
```bash
npm run test:ui-api-sync
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run pretest
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines
- 🔍 Follow TypeScript best practices
- 📝 Write comprehensive tests
- 📚 Update documentation
- 🎯 Use meaningful commit messages
- 🏷️ Tag tests appropriately

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Priyanshu Jain**
- 🔗 [LinkedIn](https://www.linkedin.com/in/priyanshu-jain-9506a61a7/)
- 🐙 [GitHub](https://github.com/priyanshujain10)

---

<div align="center">

### 🌟 Show your support!

Give a ⭐️ if this project helped you!

[![GitHub stars](https://img.shields.io/github/stars/priyanshujain10/playwright-api-automation-framework?style=social)](https://github.com/priyanshujain10/playwright-api-automation-framework/stargazers)

---

*Built with ❤️ using Playwright & TypeScript*

</div>

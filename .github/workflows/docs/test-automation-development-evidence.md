# Evidence Pack — Test Automation Development in JS Ecosystem

Companion to [test-automation-development.txt](./test-automation-development.txt). Each item below has a
detailed (~2000-character) justification demonstrating a *practical* implementation in this repository —
not just a definition — plus the exact artifact(s) to attach as proof. Paths are relative to the repo root.

---

## 1. npm versioning and dependency management

### Semantic versioning (major/minor/patch)
`package.json` devDependencies are all published under `MAJOR.MINOR.PATCH` semver (e.g.
`@playwright/test: ^1.58.0`, `typescript: ^5.9.3`, `eslint: ^9.39.2`, `winston: ^3.19.0`). This isn't a
passive fact about the ecosystem — it actively drives decisions in this framework. TypeScript's major
version is tracked closely (`5.9.3`) because a major bump can change how `strict` mode interprets code
(new syntax errors, stricter inference) and could silently break `tsc --noEmit` in `npm run pretest`
without any application code changing. `@playwright/test`'s minor version is allowed to move more freely
because Playwright follows semver strictly for its public `test`/`expect`/fixture APIs — minor releases
add capability (new matchers, new fixture options) without removing what this framework already calls.
ESLint's major (`9.x`) matters because ESLint 9 changed the default config format to flat config
(`eslint.config.js`, present in this repo) — a major-version-driven architectural decision, not just a
version number. Understanding major=breaking/minor=additive/patch=fix is what justifies treating some
dependencies (compiler, lint engine) more conservatively than others (assertion libraries, loggers) when
deciding update cadence, rather than treating every dependency bump identically.
**Attach:** `package.json`

### Difference between `^`, `~`, and exact versions
Every current devDependency in `package.json` uses a caret range (e.g. `^1.58.0`, `^5.9.3`), which per
npm's semver resolution allows any `1.x.y`/`5.x.y` upgrade but blocks `2.0.0`/`6.0.0` — i.e. automatic
minor/patch adoption, manual major adoption. A tilde (`~1.58.0`) would be stricter, only allowing
patch-level `1.58.x` bumps, which this repo deliberately avoids for devDependencies since it wants minor
feature updates from tools like Playwright without manual intervention. The newly added `.npmrc` sets
`save-exact=true`, which changes the *default* for any dependency added from this point forward: instead
of npm writing a caret range automatically, `npm install <pkg>` will write the exact resolved version
(no `^`/`~` at all) into `package.json`. This demonstrates understanding all three strategies in the same
codebase: existing deps intentionally use caret ranges for controlled auto-updates, while the `.npmrc`
policy pins *new* additions exactly, trading a small amount of upgrade convenience for full reproducibility
on packages not yet proven safe to auto-update. This mirrors a real-world dependency-management strategy:
loosen constraints on trusted, semver-disciplined packages; tighten them on anything new until its release
history is understood.
**Attach:** `.npmrc`, `package.json` (devDependencies block)

### package-lock.json
`package-lock.json` is committed at the repo root (verified present and tracked in git), which is the
single artifact that pins the *entire resolved dependency graph* — not just the direct dependencies listed
in `package.json`, but every transitive dependency's exact version, resolved integrity hash, and where it
was fetched from. Two engineers running `npm install` from the same `package.json` on different days could
otherwise get different transitive versions if a transitive dependency published a new minor version in
between — the lockfile eliminates that non-determinism entirely. This matters concretely for this
framework because a change deep in the dependency tree (e.g. a transitive dependency of `eslint` or
`allure-playwright`) could alter lint output or reporting behavior without any visible change to
`package.json`. Because the lockfile is committed, CI (`npm ci` in every workflow) and every local
`npm install` reconstruct the exact same `node_modules` tree byte-for-byte, which is the precondition for
being able to say "it passed in CI" and "it passed locally" mean the same thing.
**Attach:** `package-lock.json` (existence + `git log` showing it's tracked)

### npm install vs npm ci
All CI workflows run `npm ci`, never `npm install` (e.g. `.github/workflows/pr-validation.yml`, install
step). The two commands solve different problems: `npm install` is a *developer* command — it reads
`package.json`, resolves what's missing or outdated against `package-lock.json`, and will happily *update*
the lockfile if versions drift, which is exactly the flexibility a developer wants when adding or bumping a
dependency locally. `npm ci` is a *CI/reproducibility* command — it deletes `node_modules` first, installs
strictly and only from what's already in `package-lock.json`, and fails outright if `package.json` and
`package-lock.json` are out of sync (e.g. someone edited `package.json` without running `npm install`
afterward to update the lock). That fail-fast behavior is deliberate: it converts a silent, hard-to-debug
drift ("works on my machine, fails in CI") into an immediate, loud CI failure at the install step, before a
single test even runs. This repo's workflows are consistent about this split — local development uses
`npm install` when a dependency changes, CI always uses `npm ci` to install exactly what was committed.
**Attach:** `.github/workflows/pr-validation.yml` (Install step), `.github/workflows/api-tests.yml`

### Pinning package versions
Pinning happens at two different layers in this repo, deliberately. First, the *runtime* is pinned via the
newly added `package.json` `engines` field (`"node": ">=20.0.0 <21.0.0", "npm": ">=10.0.0"`), which
constrains which Node/npm major version this framework is allowed to run under — a compiled TypeScript
target of `ES2020` and Playwright's own Node-version support matrix both depend on this. Paired with
`.npmrc`'s `engine-strict=true`, an `npm install` on an unsupported Node version (e.g. Node 18 or Node 22)
now fails immediately with a clear engine-mismatch error, instead of silently succeeding and producing a
`node_modules` tree that might behave subtly differently (different V8 built-ins, different native module
ABI) on that unsupported runtime. Second, *dependency* pinning happens through the combination of caret
ranges plus the committed lockfile: the caret range is the *policy* ("stay on 1.x"), the lockfile is the
*enforcement* (the exact 1.x.y actually installed everywhere). Together these two pinning mechanisms cover
both axes that matter for a CI-driven test framework — the platform it runs on, and the packages it
depends on — rather than pinning only one and leaving the other to drift.
**Attach:** `package.json` (engines field), `.npmrc`

### Dependency update strategy
The update strategy here is intentionally staged rather than automatic-and-immediate or manual-and-never.
Day-to-day, caret ranges (`^1.58.0`, etc.) mean that a plain `npm install` will pick up new minor/patch
releases automatically when the lockfile is regenerated — this is deliberate for fast-moving,
semver-disciplined packages like `@playwright/test`, where minor releases frequently ship bug fixes
relevant to flaky-test diagnosis. `package-lock.json`, however, freezes exactly what's installed in CI and
on every other contributor's machine until someone *intentionally* runs `npm update` (or bumps a specific
package) and commits the regenerated lockfile — turning what could be silent, ambient drift into a
reviewable diff in a pull request, where a reviewer can see exactly which package moved from which version
to which version. This is the practical difference between "dependencies update themselves invisibly" and
"dependencies update on a schedule someone controls," and it's why this repo treats a lockfile change as a
real code change worth reviewing, not incidental noise to ignore in a diff.
**Attach:** `package.json`, `package-lock.json`

### Use of overrides where applicable
`package.json` now includes `"overrides": { "cross-spawn": "^7.0.5" }`. `cross-spawn` is not a direct
dependency of this project — it's pulled in transitively by dev tooling (test runners, lint tooling
invoking subprocesses) that this repo doesn't control the `package.json` of. If a security advisory is
published against an older `cross-spawn` version and the direct dependency that pulls it in hasn't yet
released a new version bumping its own `cross-spawn` requirement, waiting for every upstream maintainer to
publish a fix could take days or weeks. The `overrides` field is npm's mechanism for closing that gap
immediately: it forces every occurrence of `cross-spawn` anywhere in the dependency tree — regardless of
which direct dependency requested it — to resolve to the specified safe range, without needing to fork,
patch, or wait on any upstream package. This is a real, applicable use of `overrides` (as opposed to a toy
example) because it addresses exactly the scenario `overrides` exists for: a transitive vulnerability where
the direct dependency chain hasn't caught up yet, verified by running `npm ls cross-spawn` before and after
to confirm the override actually changes the resolved version in the tree, not just the declared intent in
`package.json`.
**Attach:** `package.json` (overrides field)

---

## 2. TypeScript vs JavaScript differences

### Static typing vs runtime behavior
`apiContracts.types.ts` defines the domain model this framework talks in — `ApiResponse<T>`, `Order`,
`Cart`, `Address`, `OrderStatus`, etc. — entirely as compile-time constructs. `tsc` erases every one of
these types when it compiles; at runtime, a `CreateOrderRequest` object is just a plain JS object with no
trace that TypeScript ever validated its shape. Concretely, this means: if `orderController.createOrder`
declares its argument type incompatible with what `OrderRequestBuilder.build()` returns, `tsc --noEmit`
(run in `npm run pretest`) fails the build *before* any test executes — that's the value TypeScript adds
that plain JavaScript can't, catching an entire class of "wrong shape passed to a function" bugs at
compile time. But the ceiling of that guarantee is exactly the boundary between the type system and the
outside world: nothing in `CreateOrderRequest`'s type stops the live Flipkart-style API from actually
returning `null` for a field documented as `string`, or omitting a field entirely under some backend edge
case. TypeScript has no way to inspect an HTTP response body's actual runtime shape — it only knows what
the *type annotation* on the `.json()` call claims. That gap between "the type says string" and "the JSON
that arrived over the wire" is exactly the boundary `expectUtil.ts`'s Ajv-based schema validation exists to
police at runtime, which is why this framework treats compile-time types and runtime schema checks as two
separate, complementary safety nets rather than assuming one replaces the other.
**Attach:** `src/applications/controllers/helper/interfaces/apiContracts.types.ts`

### Type inference
Rather than annotating every intermediate variable, this codebase leans on TypeScript's inference engine
to propagate types automatically. `product.controller.ts` builds a `queryString` from
`RequestBuilderUtility` without an explicit type annotation — TS infers its exact string-literal-adjacent
shape from `RequestBuilderUtility`'s own declared return type, and that inferred type then flows forward
into every place `queryString` is subsequently used (e.g. concatenated into a URL passed to `this.get()`),
so a mismatch downstream is still caught even though no one wrote the type by hand. This matters
practically: controllers in this repo already carry heavy return-type annotations (`Promise<APIResponse>`)
at their *public* boundary, where inference can't help since there's no expression to infer from — but
internal locals stay annotation-free, keeping the code readable while TS's control-flow analysis still
verifies every assignment and usage against the inferred type. This is the idiomatic split for
production TypeScript: annotate function signatures (the contract other files depend on) explicitly,
let the compiler infer everything transient inside a function body — and this framework follows that split
consistently across controllers rather than either over-annotating every local variable or leaving public
APIs untyped.
**Attach:** `src/applications/controllers/product.controller.ts`, `src/applications/controllers/helper/requestBuilder.utility.ts`

### Interfaces vs types
The codebase draws a real, consistent line between `interface` and `type`, not an arbitrary one.
`interface` is used for object shapes meant to be *implemented* or *extended* — `ApiResponse<T>`,
`ReportingAdapter`, `RequestBuilder<T>`, `ReadableController`/`WritableController` — because interfaces
support declaration merging and, more importantly here, the `implements`/`extends` relationships that this
framework's SOLID artifacts depend on (`APIBase implements WritableController`,
`WritableController extends ReadableController`). `type` is used instead wherever the shape is a union,
alias, or derived type that will never be implemented by a class — `OrderStatus` (a string-literal union
of valid states), `GetOptions = Parameters<...>` (derived directly from an existing function's parameter
tuple rather than hand-written). Trying to express `OrderStatus` as an `interface` wouldn't even compile,
since interfaces describe object shapes, not unions — which is exactly why the codebase reaches for `type`
there instead of using it interchangeably with `interface`. This split isn't cosmetic: it signals to any
future contributor, just from the keyword used, whether a given contract is meant to be implemented by a
class (`interface`) or is a closed, derived shape that should be pattern-matched/narrowed instead
(`type`).
**Attach:** `src/applications/controllers/helper/interfaces/apiContracts.types.ts` (OrderStatus vs Order), `src/core/models/userDefinedTypes.ts`

### Generics
Generics let this framework write one contract and reuse it across every domain entity instead of
duplicating structure per type. `ApiResponse<T>` and `PaginatedResponse<T>` are defined once and
instantiated as `ApiResponse<Product>`, `ApiResponse<Cart>`, `ApiResponse<Order>` etc. across controllers —
the envelope/pagination/error-shape logic is written exactly once, and the compiler still knows precisely
what `.data` resolves to at each call site because the generic parameter is threaded through. The newly
added `RequestBuilder<T>` interface applies the identical idea to test data construction:
`OrderRequestBuilder implements RequestBuilder<CreateOrderRequest>` and (implicitly, via its own `build()`
return type) `CartItemBuilder` specializes the same one-method generic contract for two completely
different payload shapes, so a test consuming `RequestBuilder<T>` generically (e.g. a helper that logs
whatever `.build()` produces) doesn't need a different code path per builder. This is a concrete,
practical use of generics — not a textbook `identity<T>(x: T): T` example — because it's the exact
mechanism preventing this codebase from needing five near-duplicate response-envelope interfaces or five
near-duplicate builder interfaces, one per domain entity.
**Attach:** `src/applications/controllers/helper/interfaces/apiContracts.types.ts`, `src/applications/testDataBuilders/requestBuilder.interface.ts`

### Transpilation
`tsconfig.json` targets `ES2020`/`module: commonjs`, meaning `tsc` (when actually run to emit output)
would lower newer TS/JS syntax down to that target and rewrite ESM-style imports into `require()` calls
Node's commonjs loader understands. This repo uses two *separate* transpilation paths for two different
purposes, and keeps them explicit rather than conflating them. First, `npm run pretest` runs
`tsc --noEmit && eslint tests/**` — `--noEmit` means this run never produces `.js` output at all; its only
job is full-project type-checking as a fail-fast gate before tests run, catching type errors across the
entire `include` set (`src/**/*`, `tests/**/*`, `playwright.config.ts`) in one pass. Second, when
`npx playwright test` actually executes a spec file, Playwright's own test runner transpiles the `.ts` file
on the fly (via its internal esbuild-based loader) purely to make the file executable — it does not type
check at all, it only strips types and lowers syntax fast enough to not slow down test startup. Because
these are separate concerns, a type error can be caught by `pretest`'s `tsc --noEmit` gate that Playwright's
own runtime transpilation would never catch and would happily execute anyway — which is precisely why
`pretest` exists as a distinct step in this framework's script pipeline rather than trusting the test
runner's transpiler to double as a type checker.
**Attach:** `tsconfig.json`, `package.json` (pretest script)

### tsconfig configuration
Every non-default option in `tsconfig.json` is there to solve a concrete need this framework actually has,
not left at scaffolding defaults. `strict: true` turns on the full strict family (`strictNullChecks`,
`noImplicitAny`, etc.), which is what makes `Address`'s lack of an index signature meaningfully different
from `Record<string, unknown>` at compile time (a real type error this repo hit and fixed while wiring
`createOrderWithBuilder.test.ts`, rather than a hypothetical). `esModuleInterop` lets this codebase use
default-style imports against commonjs packages (like `winston`) without manual `require()`/`.default`
juggling. `resolveJsonModule: true` exists specifically because `testdata/json/**/*.json` fixture files are
imported directly as typed modules elsewhere in the suite — without this flag, those imports wouldn't
compile at all. The path aliases (`@core/*`, `@applications/*`, `@testdata/*`, `@tests/*`, `@src/*`) exist
so that deeply nested files (e.g. `src/applications/testDataBuilders/orderRequestBuilder.ts` importing
`Address` from `src/applications/controllers/helper/interfaces/apiContracts.types.ts`) never need fragile
relative paths like `../../controllers/helper/interfaces/apiContracts.types`, and match the `paths` this
repo's own `eslint.config.js` and Playwright config also resolve against — so the alias scheme is
consistent across the type checker, the linter, and the test runner rather than tsconfig-only.
**Attach:** `tsconfig.json`

### Runtime limitations of TypeScript
Because TypeScript types are erased entirely at compile time, they provide zero protection against what an
external system actually sends over the wire at runtime — that's the specific limitation this framework
addresses head-on rather than ignoring. `expectUtil.ts` validates live API responses against JSON Schema
definitions (`testdata/json/expectedSchemas/*.json`) using Ajv, *at test-execution time*, after the HTTP
call has actually returned. This is deliberately a separate, runtime-only mechanism from the compile-time
`ApiResponse<T>`/`Order`/`Cart` interfaces: a controller method can be fully, correctly typed to return
`ApiResponse<Order>`, `tsc --noEmit` can pass with zero errors, and the *actual* HTTP response at test time
could still violate that shape — a field renamed on the backend, a null where a string was documented, an
extra undocumented field — none of which TypeScript can detect since it never executes and never sees the
real payload. Ajv schema validation is the runtime safety net that closes exactly this gap: it inspects the
literal JSON body that came back from the live API and asserts it against a schema independently of
whatever the TypeScript type annotations claim, catching contract drift between the assumed types and the
system actually under test — the category of bug that is invisible to `tsc` no matter how strict the
`tsconfig.json` is configured.
**Attach:** `src/core/utils/expectUtil.ts`, `testdata/json/expectedSchemas/*.json`

---

## 3. SOLID principles — LSP, ISP, DIP

### LSP — Liskov Substitution Principle
LSP requires that any subtype be usable wherever its base type is expected, without the caller needing to
know or check which concrete subtype it actually received — no narrowed parameter types, no widened
return types, no new preconditions in overrides. This repo demonstrates it on two separate axes. On the API
client side, every controller (`ProductController`, `CartController`, `OrderController`, `PaymentController`,
etc.) extends `APIBase`, which now formally `implements WritableController` — none of them override `get`/
`post`/`put`/`patch`/`delete` with a narrower signature or a stricter contract, so `controller.fixture.ts`
can construct and inject any of them behind the same base-typed reference and every test author can rely on
identical calling conventions regardless of which controller a given fixture resolves to. On the page-object
side, before this work there was only a single page object (`ProductsPage`) with no shared contract at all —
`base.page.ts` now introduces an abstract `BasePage` with an abstract `goto(options?: GotoOptions)` and a
concrete shared `waitForLoad()`, and `ProductsPage extends BasePage`, calling `super(page)` and implementing
`goto` with the exact same signature the base class declares. This means any future page object
(`CartPage`, `CheckoutPage`, etc.) added to this framework is required by the type system itself to honor
the same `goto` contract, so a fixture or test written against `BasePage` continues to work unmodified no
matter which concrete page object is substituted in — the same LSP guarantee already relied upon for
controllers now applies uniformly to page objects too.
**Attach:** `src/core/base/apiBase.ts`, `src/applications/pages/base.page.ts`, `src/applications/pages/uiApiSync/productsPage.ts`

### ISP — Interface Segregation Principle
ISP says a consumer should depend only on the methods it actually calls, not be forced to depend on (and
therefore be coupled to changes in, or forced to stub) an entire fat interface it barely uses. Before this
work, `APIBase` exposed five HTTP verbs as one undifferentiated surface — any consumer that only ever reads
data still depended on the full read/write contract. The newly added `controllerRoles.interfaces.ts`
splits this explicitly: `ReadableController` declares only `get()`, and `WritableController extends
ReadableController` adds the four mutating verbs — so a hypothetical read-only consumer (e.g. a
reporting/diagnostics helper that only fetches data to attach to a report, or a future read-only test
double) can depend on `ReadableController` alone and never be forced to implement or mock `post`/`put`/
`patch`/`delete` it will never call. The same discipline was applied to the two other interfaces
introduced in this pass: `ReportingAdapter` exposes exactly `log()` and `attach()` — the two operations
every sink (Winston, Allure, or a hypothetical future Slack/TestRail adapter) genuinely needs, nothing
more — and `RequestBuilder<T>` exposes exactly `build()`, so any code that only needs the finished payload
depends on that single method rather than on a builder's entire fluent setter surface
(`withShippingAddress`, `withPaymentMethod`, etc.), which only the builder's own call sites need to know
about. Every interface added in this pass was sized to the smallest contract an actual caller needs, not
to the union of everything a concrete implementation happens to offer.
**Attach:** `src/core/base/controllerRoles.interfaces.ts`, `src/core/reporting/reportingAdapter.interface.ts`, `src/applications/testDataBuilders/requestBuilder.interface.ts`

### DIP — Dependency Inversion Principle
DIP requires high-level code to depend on abstractions, with concrete implementations supplied from
outside (injected) rather than constructed inline by the code that uses them. This repo already practiced
this for controllers before this pass: `controller.fixture.ts` constructs concrete controller instances
once and injects them into tests via Playwright's fixture system, so test bodies depend on fixture
parameters (an abstraction boundary) and never write `new ProductController(request)` themselves — swapping
how a controller is constructed (e.g. adding retry logic) requires touching only the fixture file, not
every test file that uses it. This pass extends the same inversion to reporting: `TestReporter`'s
constructor takes `ReportingAdapter[]` — it imports nothing from `winston` or `allure-js-commons` directly,
and has no idea at compile time whether it's fanning out to one adapter, both, or a future third one.
`AllureReportingAdapter` and `WinstonReportingAdapter` are concrete, swappable implementations of that same
abstraction, wired together only at the point of construction
(`new TestReporter([new WinstonReportingAdapter()])` in `createOrderWithBuilder.test.ts`) — exactly the
"compose concretes at the edge, program against the interface everywhere else" pattern DIP describes. If a
`SlackReportingAdapter` were added tomorrow, `TestReporter`'s own source would not change at all.
**Attach:** `src/applications/controllers/helper/controller.fixture.ts`, `src/core/reporting/testReporter.ts`, `src/core/reporting/allureReportingAdapter.ts`, `src/core/reporting/winstonReportingAdapter.ts`

### Applied to: Page objects/components
`BasePage` (`src/applications/pages/base.page.ts`) declares the abstract `goto()` contract and a shared
concrete `waitForLoad()`; `ProductsPage` (`src/applications/pages/uiApiSync/productsPage.ts`) extends it,
calls `super(page)`, and implements `goto` with the identical signature — a direct, working LSP example
rather than a diagram, since it's the actual page object exercised by the UI-API sync test suite against
the live automationexercise.com product catalog, not a placeholder class.
**Attach:** `src/applications/pages/base.page.ts`, `src/applications/pages/uiApiSync/productsPage.ts`

### Applied to: API clients
`APIBase implements WritableController`, and all six domain controllers (`ProductController`,
`CartController`, `OrderController`, `PaymentController`, and the rest under
`src/applications/controllers/`) extend `APIBase` untouched — demonstrating LSP (any of them substitutes
for `APIBase`/`WritableController`) and ISP (`ReadableController`/`WritableController` split) together on
the same class hierarchy that every real API test in this repo actually calls through.
**Attach:** `src/core/base/apiBase.ts`, `src/core/base/controllerRoles.interfaces.ts`, `src/applications/controllers/*.controller.ts`

### Applied to: Fixtures
`controller.fixture.ts` and `main.fixture.ts` construct controllers/dependencies once and inject them into
every test via Playwright's `test.extend` mechanism, so test bodies never instantiate a controller
themselves — the textbook DIP inversion of control, already load-bearing across the entire existing test
suite, not just a new example built to satisfy this checklist.
**Attach:** `src/applications/controllers/helper/controller.fixture.ts`, `src/core/fixtures/main.fixture.ts`

### Applied to: Test data builders
`RequestBuilder<T>` (ISP: one method, `build()`) is implemented by `OrderRequestBuilder` and
`CartItemBuilder`, each providing fluent `withX()` setters over sensible defaults. `createOrderWithBuilder.test.ts`
exercises both builders against the live cart/order/product controllers end-to-end — building a cart item,
adding it to cart, building a custom-shipping-address order, and asserting on the real API response — so
this is a builder pattern actually wired into a passing test, not an unused interface sitting beside the
suite.
**Attach:** `src/applications/testDataBuilders/`, `tests/order/createOrderWithBuilder.test.ts`

### Applied to: Reporting adapters
`ReportingAdapter` (ISP: `log`/`attach` only) is implemented by `AllureReportingAdapter` (delegating to
`allure-js-commons`' `attachment`/`logStep`, verified against the library's actual `.d.ts` signatures) and
`WinstonReportingAdapter` (delegating to the pre-existing Winston `logger`). `TestReporter` depends only on
`ReportingAdapter[]` (DIP) and is the object `createOrderWithBuilder.test.ts` actually calls
(`reporter.log(...)`) mid-test to log the builder-generated payload — a real call site, not a dangling
abstraction.
**Attach:** `src/core/reporting/`, `tests/order/createOrderWithBuilder.test.ts`

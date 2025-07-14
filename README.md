# Vela OS Benchmark Application

An open-source benchmark application designed for **Xiaomi Vela OS**, built with the Vela JS framework.
## Features

- **Comprehensive Benchmarks**: A suite of tests measuring Math, String, Array, Object, JSON, and Cryptography (SHA-256) performance.
- **Non-Blocking UI**: The application architecture is fully asynchronous, ensuring the UI remains responsive and fluid even during intensive benchmark runs.
- **Localization (i18n)**: Adding new languages is as simple as adding a new JSON file.

## Project Architecture

```
/src
├── app.ux                     # Global app logic, service locator, and global methods
├── common/                    # Shared assets like images
├── components/                # Reusable UI components
│   └── result-list/           # A "dumb" component for displaying benchmark results
├── config/
│   └── benchmark.config.js    # Centralized configuration for all tests
├── i18n/                      # Localization resource files for different languages
│   ├── defaults.json          # Default (English) strings
│   ├── en-US.json
│   └── ru-RU.json
├── pages/
│   └── index/                 # The main (and only) application page
├── services/
│   └── benchmark.service.js   # The "brains" of the app; all benchmark logic is here
└── manifest.json              # App configuration, permissions, and routing
```

### The Data Flow

The architecture is designed to solve the common problem of state reactivity in the Vela JS framework.

1.  **View (`index.ux`)**: The user interacts with the UI and clicks the "Run Benchmark" button.
2.  **Global Method Call**: The page calls a global method defined in `app.ux`, passing its own context (`this`) as an argument: `this.$app.$def.startBenchmark(this);`.
3.  **Service Initialization (`app.ux`)**: The `startBenchmark` method in `app.ux` instantiates the `BenchmarkService`. It injects **callbacks** that are tied to the page's context.
4.  **Business Logic (`benchmark.service.js`)**: The service runs all benchmark tests asynchronously. It knows nothing about the UI. After each test, it invokes the `onProgress` or `onComplete` callback.
5.  **State Update (Back on `index.ux`)**: The callbacks, now executing within the page's context, call local handler methods (e.g., `handleBenchmarkProgress`). These methods **process the raw data** (translate keys, format values) and update the page's **local `private` state**.
6.  **Reactive Re-render**: Because the page's local state was modified, the Vela framework triggers a reactive update, and the UI (including the `<result-list>` component) automatically re-renders with the new data.

This pattern ensures that the UI is always in sync with the application state and avoids common pitfalls with the framework's reactivity system.


## How to Contribute or Extend

### Adding a New Benchmark

1.  **Update Config**: Open `config/benchmark.config.js` and increment `totalTests`.
2.  **Add Localization Key**: Open the `i18n` files (e.g., `defaults.json`) and add a new key for your test name under the `tests` object.
3.  **Implement Logic**: Open `services/benchmark.service.js` and add a new `runTestAdaptive()` or custom `Promise`-based function call within the `start()` method. Ensure it returns a `testNameKey` that matches the one you added in the `i18n` files.

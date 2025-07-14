import config from '../config/benchmark.config.js';
import crypto from '@system.crypto';
import app from '@system.app';

/**
 * Runs a given test function for a target duration without blocking the UI thread.
 * @param {string} testNameKey - The localization key for the test name.
 * @param {Function} testFunction - The function to execute for the benchmark.
 * @returns {Promise<Object>} A promise that resolves with the benchmark result.
 */
function runTestAdaptive(testNameKey, testFunction) {
  return new Promise((resolve) => {
    let iterations = 0;
    const startTime = Date.now();
    const targetEndTime = startTime + config.targetTestDuration;

    function testChunk() {
      // Execute a small batch of iterations to avoid long-running tasks.
      const chunkStartTime = Date.now();
      while (Date.now() - chunkStartTime < 20) { // Work for max 20ms per chunk
        testFunction();
        iterations++;
      }

      // If the total time has not yet elapsed, schedule the next chunk.
      if (Date.now() < targetEndTime) {
        setTimeout(testChunk, 0); // Yield control back to the UI thread
      } else {
        // Test is complete, calculate the final score.
        const actualDuration = Date.now() - startTime;
        const ops = (iterations / (actualDuration / 1000)).toFixed(1);
        resolve({
          testNameKey: testNameKey,
          ops: `${ops} ops/s`
        });
      }
    }

    testChunk();
  });
}

/**
 * BenchmarkService class encapsulates all benchmark logic.
 */
class BenchmarkService {
  /**
   * @param {Object} options - Callbacks for progress and completion.
   * @param {Function} options.onProgress - Called after each test completes.
   * @param {Function} options.onComplete - Called when all tests are finished.
   */
  constructor(options = {}) {
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this._isRunning = false;
  }
  
  isRunning() {
    return this._isRunning;
  }
  
  /**
   * Starts the full suite of benchmark tests.
   */
  async start() {
    if (this._isRunning) return;
    this._isRunning = true;
    
    const allResults = [];
    const reportProgress = (result) => {
        allResults.push(result);
        this.onProgress(result, allResults.length, config.totalTests);
    };

    // --- Run All Tests Sequentially ---

    reportProgress(await runTestAdaptive("math", () => {
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        sum += Math.sin(i * 0.1) * Math.cos(i * 0.1);
        sum -= Math.random() * Math.PI;
      }
    }));

    reportProgress(await runTestAdaptive("string", () => {
      let str = "base";
      for (let i = 0; i < 10; i++) {
        str += "a".repeat(config.stringLength);
        str = str.slice(config.stringLength / 2);
      }
    }));

    reportProgress(await runTestAdaptive("array", () => {
      const arr = Array.from({ length: config.arraySize }, (_, i) => i);
      arr.map(x => x * 2).filter(x => x % 3 === 0).sort((a,b) => b-a);
    }));

    reportProgress(await runTestAdaptive("object", () => {
      for (let i = 0; i < 1000; i++) {
        const obj = { a: i, b: i * 2, c: { d: i * 3 } };
        const temp = obj.a + obj.b + obj.c.d;
        delete obj.c;
      }
    }));

    reportProgress(await runTestAdaptive("json", () => {
      const data = { value: "test", count: 100, items: [1, 2, 3], nested: { valid: true } };
      JSON.parse(JSON.stringify(data));
    }));

    reportProgress(await this._runCryptoTest());

    // --- Finalize ---
    
    this._isRunning = false;
    this.onComplete(allResults);
  }

  /**
   * Runs the cryptography benchmark as a separate, promise-based function.
   * @private
   */
  _runCryptoTest() {
    const testNameKey = "crypto";

    return new Promise(async (resolve) => {
      if (!app.canIUse('@system.crypto')) {
        return resolve({ testNameKey, ops: 'Not supported' });
      }

      const data = 'VelaBenchmarkTestString';
      const encoded = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        encoded[i] = data.charCodeAt(i);
      }
      
      let iterations = 0;
      const startTime = Date.now();
      const targetEndTime = startTime + config.targetTestDuration;
      let isTimedOut = false;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        resolve({ testNameKey, ops: 'Timeout' });
      }, config.cryptoTestTimeout);

      function runHashIteration(cb) {
        if (isTimedOut || Date.now() >= targetEndTime) {
            return cb();
        }
        crypto.hashDigest({
          data: encoded,
          algo: 'SHA256',
          success: () => {
            iterations++;
            // Use setTimeout to avoid stack overflow and keep UI responsive
            setTimeout(() => runHashIteration(cb), 0);
          },
          fail: (err, code) => {
            console.error(`Crypto test failed with code: ${code}`);
            resolve({ testNameKey, ops: 'Error' });
            cb();
          }
        });
      }

      runHashIteration(() => {
        clearTimeout(timeoutId);
        if (isTimedOut) return;

        const actualDuration = Date.now() - startTime;
        const ops = (iterations / (actualDuration / 1000)).toFixed(1);
        resolve({
          testNameKey: testNameKey,
          ops: `${ops} ops/s`
        });
      });
    });
  }
}

export default BenchmarkService;
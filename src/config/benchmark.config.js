// Benchmark configurations
export default {
    // Target duration for each adaptive test in milliseconds
    targetTestDuration: 1000,
    
    // The number of tests to be executed, used for progress reporting
    totalTests: 6,
  
    // --- Test-specific parameters ---
  
    // Size of the array for array operation tests
    arraySize: 1000,
    
    // Base length of the string for manipulation tests
    stringLength: 100,
    
    // Timeout for the crypto test to prevent it from running indefinitely
    cryptoTestTimeout: 10000
  };
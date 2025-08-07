// Global test utilities
global.console = {
    ...console,
    // Silence console.log in tests unless specifically testing it
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
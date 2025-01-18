/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1",
        "^main$": "<rootDir>/tests/__mocks__/main.ts",
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {}],
    },
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    testPathIgnorePatterns: ["/node_modules/", "/__mocks__/"],

    // Coverage settings
    collectCoverage: process.argv.includes("--coverage"), // Enable coverage when --coverage flag is present
    coverageDirectory: "./coverage", // Output directory for coverage reports
    coverageReporters: ["text", "lcov"], // Formats for coverage reports
    coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/src/SettingsManager"], // Optionally ignore certain files or directories from coverage
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
};

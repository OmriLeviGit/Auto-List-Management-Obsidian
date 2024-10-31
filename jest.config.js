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
};

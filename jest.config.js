/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  roots: ["<rootDir>/modules"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: [
    "modules/client/**/*.ts",
    "modules/stock/**/*.ts",
    "modules/salesperson/**/*.ts",
    "!**/*.types.ts",
    "!**/*.keys.ts",
    "!**/*.queries.ts",
    "!**/*.mutations.ts",
    "!**/*.validation.ts",
  ],
};

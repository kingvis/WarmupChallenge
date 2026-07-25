import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  preset: "ts-jest",

  // Transform TypeScript
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // Relax some TS strictness for tests
          noUnusedLocals: false,
          noUnusedParameters: false,
          strict: false,
        },
        diagnostics: {
          // Don't fail tests on TS errors from Next.js internals
          ignoreCodes: [1343, 2345, 7006],
        },
      },
    ],
  },

  // Module aliases matching tsconfig paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Stub out Next.js server-side imports that don't work in Jest
    "^next/server$": "<rootDir>/src/__tests__/__mocks__/nextServer.ts",
  },

  modulePathIgnorePatterns: [
    "<rootDir>/WarmupChallenge/",
    "<rootDir>/.kilo/",
  ],

  // Test discovery
  testMatch: [
    "<rootDir>/src/__tests__/**/*.test.ts",
    "<rootDir>/src/__tests__/**/*.test.tsx",
  ],

  // Coverage configuration
  collectCoverageFrom: [
    "src/app/api/**/*.ts",
    "!src/app/api/**/*.d.ts",
  ],

  // Performance
  testTimeout: 10000,
};

export default config;

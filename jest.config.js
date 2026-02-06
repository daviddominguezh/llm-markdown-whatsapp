const config = {
  clearMocks: true,
  collectCoverage: true,
  testTimeout: 120000,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@globalTypes/(.*)\\.js$': '<rootDir>/src/types/$1',
    '^@globalUtils/(.*)\\.js$': '<rootDir>/src/utils/$1',
    '^@src/(.*)\\.js$': '<rootDir>/src/$1',
    '^@globalTypes/(.*)$': '<rootDir>/src/types/$1',
    '^@globalUtils/(.*)$': '<rootDir>/src/utils/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'NodeNext',
          moduleResolution: 'nodenext',
          target: 'ES2024',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          allowImportingTsExtensions: true,
          isolatedModules: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],
};

export default config;

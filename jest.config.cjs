module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/src/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
    moduleNameMapper: {
        '^\\./pool\\.js$': '<rootDir>/src/database/pool.ts',
        '^\\.\\./pool\\.js$': '<rootDir>/src/database/pool.ts',
        '^\\.\\./database/pool\\.js$': '<rootDir>/src/database/pool.ts',
        '^\\.\\./queries\\.js$': '<rootDir>/src/database/queries.ts',
        '^\\.\\./database/queries\\.js$': '<rootDir>/src/database/queries.ts',
        '^\\.\\./user\\.js$': '<rootDir>/src/database/user.ts',
        '^\\./test_helpers\\.js$': '<rootDir>/src/database/tests/test_helpers.ts',
        '^\\.\\./\\.\\./backend/nlp\\.js$': '<rootDir>/src/backend/nlp.ts',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};
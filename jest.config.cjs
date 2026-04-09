module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/src/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};
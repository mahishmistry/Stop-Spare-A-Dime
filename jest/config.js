module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/src/**/*.test.ts'], // Match test files in src directory

    transform: { // Transform TypeScript files using ts-jest
        '^.+\\.ts$': 'ts-jest',
    },

    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$', // Match test files with .test.ts or .spec.ts

    moduleFileExtensions: ['ts', 'js', 'json', 'node', 'tsx'], // Recognize these file extensions
};
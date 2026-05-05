import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const baseConfig = require('../jest.config.cjs');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	...baseConfig,
	rootDir: path.resolve(__dirname, '..'),
};
const path = require('node:path');
const { rmSync } = require('node:fs');

// Remove only generated output so moved maintenance modules cannot be deployed accidentally.
rmSync(path.resolve(__dirname, '../build'), { recursive: true, force: true });

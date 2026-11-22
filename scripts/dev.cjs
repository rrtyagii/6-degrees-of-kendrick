const { spawn } = require('node:child_process');
const path = require('node:path');

function packageBin(name, command) {
    const manifestPath = path.resolve(__dirname, '../node_modules', name, 'package.json');
    const manifest = require(manifestPath);
    const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[command];
    return path.resolve(path.dirname(manifestPath), bin);
}

const commands = [
    [packageBin('typescript', 'tsc'), '--watch', '--preserveWatchOutput'],
    [packageBin('@tailwindcss/cli', 'tailwindcss'), '-i', 'src/styles/styles.css', '-o', 'src/styles/output.css', '--watch'],
    ['--watch', 'build/server.js'],
];
const children = [];
let stopping = false;

function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children) child.kill('SIGTERM');
}

for (const command of commands) {
    const child = spawn(process.execPath, command, { stdio: 'inherit' });
    children.push(child);
    child.on('error', error => {
        console.error(error.message);
        stop(1);
    });
    child.on('exit', code => { if (!stopping) stop(code || 1); });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

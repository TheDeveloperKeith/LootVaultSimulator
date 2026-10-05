import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, ...args], { maxBuffer: 64 * 1024 * 1024 });
const worktree = process.argv.includes('--worktree');
const files = git('ls-files', ...(worktree ? ['--cached', '--others', '--exclude-standard'] : []), '-z').toString().split('\0').filter(Boolean);
const known = new Set();
for (const name of ['.env', 'application-local.properties']) {
    if (!fs.existsSync(name)) continue;
    for (const line of fs.readFileSync(name, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([^#=]+)=(.*)$/);
        if (match && /password|secret|token|phrase/i.test(match[1])) {
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            if (value.length >= 8 && !value.includes('${')) known.add(value);
        }
    }
}
let failed = false;
for (const name of files) {
    let reason;
    if (/(^|\/)\.env(?:\..+)?$/.test(name) && !name.endsWith('.env.example')) reason = 'environment file';
    if (/(^|\/)(node_modules|target|dist|repo-mirror\.git|\.git|\.claude)\//.test(name)) reason = 'generated files or embedded history';
    if (/(^|\/)application-local\.properties$|\.(pem|key|p12|pfx|bundle)$/.test(name)) reason = 'private configuration or key';
    const buffer = worktree ? fs.readFileSync(name) : git('show', `:${name}`);
    if (!buffer.includes(0)) {
        const text = buffer.toString();
        if ([...known].some(secret => text.includes(secret))) reason = 'matches a local secret';
        if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bAKIA[0-9A-Z]{16}\b/.test(text)) reason = 'credential signature';
        if (/^spring\.datasource\.password\s*=\s*(?!\$\{)\S+/m.test(text)) reason = 'literal database password';
    }
    if (reason) { console.error(`${name}: ${reason}`); failed = true; }
}
if (failed) process.exit(1);
console.log(`Publish check passed for ${files.length} ${worktree ? 'working-tree' : 'staged'} files. No known local secrets or excluded paths found. This is not a guarantee against every possible secret.`);

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
export const defaultMockRoot = path.resolve(import.meta.dirname, '../../mock');
export function workspaceRuntimeFiles(mockRoot = defaultMockRoot) {
  const manifestPath = 'lib/workspace-runtime-manifest.json';
  const manifest = JSON.parse(fs.readFileSync(path.join(mockRoot, manifestPath), 'utf8'));
  if (manifest.version !== 1 || !manifest.apps || Object.keys(manifest.apps).sort().join() !== 'chats,files,hr,marketing,sales,tasks') throw new Error('Workspace runtime manifest is incomplete');
  const files = [...new Set([manifestPath, ...Object.values(manifest.apps).flat(), ...Object.values(manifest.staff || {}).flat()])].sort();
  for (const file of files) {
    if (typeof file !== 'string' || !/^(apps|lib)\/[\w./-]+\.(js|json)$/.test(file) || file.split('/').includes('..') || file.endsWith('.test.js') || file.endsWith('harness.js')) throw new Error(`Invalid workspace source: ${file}`);
    const source = path.resolve(mockRoot, file), relative = path.relative(fs.realpathSync(mockRoot), fs.realpathSync(source));
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(source).isFile()) throw new Error(`Workspace source leaves mock runtime: ${file}`);
  }
  return files;
}
export function copyWorkspaceRuntime(folder, mockRoot = defaultMockRoot) {
  const root = fs.realpathSync(folder), files = workspaceRuntimeFiles(mockRoot);
  for (const file of files) {
    const target = path.resolve(root, 'mock', file), relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Workspace destination leaves function');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(mockRoot, file), target);
  }
  return files;
}
export function checkWorkspaceRuntime(folder, mockRoot = defaultMockRoot) {
  const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const files = workspaceRuntimeFiles(mockRoot);
  for (const file of files) {
    const target = path.resolve(folder, 'mock', file);
    if (!fs.existsSync(target) || digest(target) !== digest(path.join(mockRoot, file))) throw new Error(`Workspace source was altered or omitted: ${file}`);
  }
  return files.length;
}

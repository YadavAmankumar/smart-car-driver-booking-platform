const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.clear();

// ANSI colors (no packages)
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const c = (color, s) => `${ANSI[color] || ''}${s}${ANSI.reset}`;

const ROOT = process.cwd();
const startedAt = Date.now();

const serverSrcDir = path.join(ROOT, 'server', 'src');
const clientAppDir = path.join(ROOT, 'client', 'app');
const clientComponentsDir = path.join(ROOT, 'client', 'components');

function existsDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function existsFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}
function toPosix(p) {
  return p.split(path.sep).join('/');
}

function walk(rootDir, maxDepth = 80) {
  const files = [];
  const dirs = [];

  function rec(cur, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      return;
    }
    dirs.push(cur);
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) rec(full, depth + 1);
      else if (e.isFile()) files.push(full);
    }
  }

  if (existsDir(rootDir)) rec(rootDir, 0);
  return { files, dirs };
}

function listFilesByExt(dir, exts) {
  const { files } = walk(dir, 120);
  const set = new Set(exts.map((x) => x.toLowerCase()));
  return files.filter((f) => set.has(path.extname(f).toLowerCase())).map(toPosix);
}

function deriveNextAppRoutesFromPages() {
  if (!existsDir(clientAppDir)) return { routes: [], pagesCount: 0 };
  const { files } = walk(clientAppDir, 60);
  const pageFiles = files.filter((f) => /\/page\.(t|j)sx?$/i.test(toPosix(f)));

  const routes = new Set();
  let pagesCount = pageFiles.length;

  for (const fileAbs of pageFiles) {
    const fileRel = toPosix(path.relative(clientAppDir, fileAbs));
    const parts = fileRel.split('/');

    if (parts.length === 1 && parts[0].startsWith('page.')) {
      routes.add('/');
      continue;
    }

    const folder = parts.slice(0, -1).join('/');
    const display = folder
      .split('/')
      .filter(Boolean)
      .map((seg) => {
        const m = seg.match(/^\[(.+)\]$/);
        return m ? `:${m[1]}` : seg;
      })
      .join('/');

    routes.add(`/${display}`.replace(/\/+/g, '/'));
  }

  return { routes: Array.from(routes).sort(), pagesCount };
}

function parseApiMountPoints(appJsPath) {
  if (!existsFile(appJsPath)) return [];
  const txt = readText(appJsPath);
  const re = /app\.(use|get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
  const mounts = [];
  let m;
  while ((m = re.exec(txt)) !== null) {
    mounts.push({ method: (m[1] || 'USE').toUpperCase(), mount: m[2] });
  }
  const seen = new Set();
  return mounts.filter((x) => (seen.has(x.mount) ? false : (seen.add(x.mount), true)));
}

function detectApiRoutesHeuristic(routeFiles) {
  const re = /router\.(get|post|put|delete|patch|options)\s*\(\s*['"]([^'"]+)['"]/g;
  const out = [];
  const seen = new Set();

  for (const rf of routeFiles) {
    const txt = readText(rf);
    let m;
    while ((m = re.exec(txt)) !== null) {
      const method = (m[1] || '').toUpperCase();
      const p = m[2] || '';
      if (!method || !p) continue;
      const k = `${method} ${p}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ method, path: p, file: toPosix(rf) });
    }
  }

  return out.sort((a, b) => a.path.localeCompare(b.path)).slice(0, 20);
}

function gitInfo() {
  const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();

  let branch = 'Not Found';
  try {
    branch = run('git branch --show-current').trim() || 'Unknown';
  } catch {}

  let statusSummary = { staged: 0, unstaged: 0, total: 0 };
  try {
    const out = run('git status --porcelain');
    const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let staged = 0;
    let unstaged = 0;
    for (const line of lines) {
      const x = line[0];
      const y = line[1];
      if (x && x !== ' ') staged++;
      if (y && y !== ' ') unstaged++;
    }
    statusSummary = { staged, unstaged, total: lines.length };
  } catch {}

  let lastCommits = [];
  try {
    lastCommits = run('git log -5 --oneline')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch {}

  return { branch, statusSummary, lastCommits };
}

function dynamicProgress(mods) {
  const total = mods.reduce((a, m) => a + m.backendW + m.frontW, 0);
  const backendTotal = mods.reduce((a, m) => a + m.backendW, 0);
  const frontTotal = mods.reduce((a, m) => a + m.frontW, 0);

  const backendDone = mods.reduce((a, m) => a + (m.ok ? m.backendW : 0), 0);
  const frontDone = mods.reduce((a, m) => a + (m.ok ? m.frontW : 0), 0);

  const overallDone = backendDone + frontDone;

  const backendPct = backendTotal ? (backendDone / backendTotal) * 100 : 0;
  const frontPct = frontTotal ? (frontDone / frontTotal) * 100 : 0;
  const overallPct = total ? (overallDone / total) * 100 : 0;

  const completed = mods.filter((m) => m.ok).map((m) => m.name);
  const missing = mods.filter((m) => !m.ok).map((m) => m.name);

  return { backendPct, frontPct, overallPct, completed, missing };
}

function formatPct(n) {
  const v = Math.max(0, Math.min(100, Number(n) || 0));
  return `${Math.round(v)}%`;
}

const git = gitInfo();

// Backend detection
const backend = (() => {
  const controllers = listFilesByExt(path.join(serverSrcDir, 'controllers'), ['.js']);
  const routesDir = path.join(serverSrcDir, 'routes');
  const routes = listFilesByExt(routesDir, ['.js']);
  const models = listFilesByExt(path.join(serverSrcDir, 'models'), ['.js']);
  const middleware = listFilesByExt(path.join(serverSrcDir, 'middleware'), ['.js']);
  const configs = listFilesByExt(path.join(serverSrcDir, 'config'), ['.js']);

  const appJsPath = path.join(serverSrcDir, 'app.js');
  const apiMounts = parseApiMountPoints(appJsPath);

  const apiRoutes = detectApiRoutesHeuristic(routes);

  return { controllers, routes, models, middleware, configs, apiMounts, apiRoutes };
})();

// Frontend detection
const frontend = (() => {
  const { routes, pagesCount } = deriveNextAppRoutesFromPages();

  const reusable = (() => {
    if (!existsDir(clientComponentsDir)) return [];
    const { files } = walk(clientComponentsDir, 80);
    const tsx = files.filter((f) => /\.tsx$/i.test(f)).map(toPosix);
    const picked = tsx.filter((p) => {
      return (
        p.includes('/components/layout/') ||
        p.includes('/components/ui/') ||
        p.endsWith('/components/providers.tsx')
      );
    });
    return Array.from(new Set(picked)).slice(0, 30);
  })();

  return { routes, pagesCount, reusableComponents: reusable };
})();

// Module completion (dynamic, based on detection)
const progress = (() => {
  const has = {
    backendFoundation: existsFile(path.join(serverSrcDir, 'app.js')) && existsFile(path.join(serverSrcDir, 'server.js')),
    auth: backend.controllers.some((f) => /authController\.js$/i.test(f)) && backend.routes.some((f) => /authRoutes\.js$/i.test(f)),
    booking: backend.controllers.some((f) => /bookingController\.js$/i.test(f)) && backend.routes.some((f) => /bookingRoutes\.js$/i.test(f)),
    landing: frontend.routes.includes('/'),
    car: backend.routes.some((f) => /\/car\//.test(f)) || backend.controllers.some((f) => /\/car\//.test(f)),
    driver: backend.routes.some((f) => /\/driver\//.test(f)) || backend.controllers.some((f) => /\/driver\//.test(f)),
    admin: frontend.routes.includes('/dashboard') || backend.routes.some((f) => /\/admin\//.test(f)),
    payment: backend.routes.some((f) => /\/payment\//.test(f)) || backend.controllers.some((f) => /\/payment\//.test(f)),
    reports: backend.routes.some((f) => /report/i.test(f)),
  };

  const mods = [
    { name: 'Backend Foundation', backendW: 18, frontW: 0, ok: has.backendFoundation },
    { name: 'Authentication', backendW: 14, frontW: 8, ok: has.auth && has.landing },
    { name: 'Landing Page', backendW: 0, frontW: 10, ok: has.landing },
    { name: 'Booking Module', backendW: 18, frontW: 12, ok: has.booking && (frontend.routes.includes('/booking') || frontend.routes.includes('/bookings')) },
    { name: 'Car Module', backendW: 10, frontW: 8, ok: has.car },
    { name: 'Driver Module', backendW: 10, frontW: 8, ok: has.driver },
    { name: 'Admin Dashboard', backendW: 8, frontW: 10, ok: has.admin },
    { name: 'Payment', backendW: 10, frontW: 6, ok: has.payment },
    { name: 'Reports', backendW: 6, frontW: 4, ok: has.reports },
  ];

  return dynamicProgress(mods);
})();

function nextTask() {
  const missing = progress.missing;
  const rules = [
    ['Authentication', 'Implement role-based authorization for protected endpoints and add auth hardening (status checks / refresh token strategy).'],
    ['Booking Module', 'Add booking ownership checks + bookingValidation middleware enforcement (route-level validation).'],
    ['Car Module', 'Create Car model + controller + routes and integrate into Booking flow.'],
    ['Driver Module', 'Create Driver model + controller + routes and integrate into Booking flow.'],
    ['Admin Dashboard', 'Add admin-only routes/middleware and wire admin dashboard pages.'],
    ['Payment', 'Implement Payment module (model + controller + routes) and connect payment status to booking lifecycle.'],
    ['Reports', 'Add report endpoints and dashboard visualizations.'],
  ];

  for (const [k, task] of rules) {
    if (missing.includes(k)) return task;
  }
  return 'Stabilize MVP: add tests + centralized error/validation normalization and strengthen security (CORS + rate limiting).';
}

function backendSummaryLine(label, ok, count) {
  return `${ok ? c('green', 'OK') : c('yellow', 'MISS')} ${label}${typeof count === 'number' ? `: ${count}` : ''}`;
}

const elapsedMs = Date.now() - startedAt;
const dateStr = new Date().toLocaleString();

// Output (simple)
console.log('===========================');
console.log('SMART CAR DRIVER BOOKING PLATFORM');
console.log('===========================');

console.log('\nProject Info');
console.log(`- Date           : ${dateStr}`);
console.log(`- OS             : ${os.platform()} ${os.release()}`);
console.log(`- Node Version  : ${process.version}`);
console.log(`- Project Folder: ${path.basename(ROOT)}`);
console.log(`- Git Branch    : ${git.branch}`);

console.log('\nGit Status');
console.log(`- git status: ${git.statusSummary.total === 0 ? c('green', 'Clean') : c('yellow', 'Changes Found')}`);
console.log(`  Staged   : ${git.statusSummary.staged}`);
console.log(`  Unstaged : ${git.statusSummary.unstaged}`);
console.log('- Last 5 commits:');
if (git.lastCommits.length) {
  for (const line of git.lastCommits) console.log(`  • ${line}`);
} else {
  console.log('  • Not Found');
}

console.log('\nBackend Analysis');
console.log(`- Controllers   : ${backend.controllers.length}`);
console.log(`- Routes        : ${backend.routes.length}`);
console.log(`- Models        : ${backend.models.length}`);
console.log(`- Middleware    : ${backend.middleware.length}`);
console.log(`- Config        : ${backend.configs.length}`);
console.log(`- Existing API mounts: ${backend.apiMounts.length ? backend.apiMounts.map((m) => m.mount).join(', ') : 'None detected'}`);
console.log(`- Existing API routes (heuristic): ${backend.apiRoutes.length}`);

console.log('\nFrontend Analysis');
console.log(`- Pages        : ${frontend.pagesCount}`);
console.log(`- App routes   : ${frontend.routes.length ? frontend.routes.join(', ') : 'None detected'}`);
console.log(`- Reusable components: ${frontend.reusableComponents.length}`);

console.log('\nProgress Summary');
console.log(`- Backend Progress : ${formatPct(progress.backendPct)}`);
console.log(`- Frontend Progress: ${formatPct(progress.frontPct)}`);
console.log(`- Overall Progress : ${formatPct(progress.overallPct)}`);
console.log(`- Completed Modules: ${progress.completed.length ? progress.completed.join(', ') : 'None'}`);
console.log(`- Missing Modules  : ${progress.missing.length ? progress.missing.join(', ') : 'None'}`);

console.log('\nNext Task');
console.log(c('cyan', nextTask()));

console.log(`\nExecution time: ${elapsedMs} ms`);


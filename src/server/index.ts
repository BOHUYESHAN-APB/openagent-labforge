/**
 * extendai-lab Web Dashboard + MCP Server v2
 *
 * Full features: skill viewer, Markdown rendering, HTML preview,
 * theme toggle, docs browser, config editor, plan viewer.
 */
import { readFile, readdir, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { renderDashboard, renderSkillsList, renderSkillDetail, renderDocs, renderDocFile, renderPlans, renderPlanFile, renderConfigEditor, renderError } from './pages';

const PORT = 25569;
const HOST = '127.0.0.1';
let workspaceRoot = process.cwd();
let pluginRoot = resolve(dirname(new URL(import.meta.url).pathname), '..');
let currentTheme = 'dark';

// ── Logging ───────────────────────────────────────────
const OPENCODE_LOG_DIR = resolve(homedir(), '.local', 'share', 'opencode');
const PLUGIN_LOG_DIR = resolve(OPENCODE_LOG_DIR, 'extendai-lab');
let logFilePath = '';

function initLogger() {
  try { mkdir(OPENCODE_LOG_DIR, { recursive: true }); } catch {}
  try { mkdir(PLUGIN_LOG_DIR, { recursive: true }); } catch {}
  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  logFilePath = join(OPENCODE_LOG_DIR, `extendai-server.${now}.log`);
}
async function srvLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { await appendFile(logFilePath, line); } catch {}
  console.error(msg);
}

// ── Skills scanning ──────────────────────────────────
interface SkillInfo { name: string; category: string; zhName: string; description: string; path: string }

function findSkillDirs(): string[] {
  const dirs: string[] = [];
  // Plugin's own skills (packaged with npm)
  const pkgSkills = join(pluginRoot, 'src', 'skills');
  if (existsSync(pkgSkills)) dirs.push(pkgSkills);
  // ThirdParty skills
  const tpSkills = join(pluginRoot, 'ThirdParty', 'html-anything-skills');
  if (existsSync(tpSkills)) dirs.push(tpSkills);
  const tpPpt = join(pluginRoot, 'ThirdParty', 'guizang-ppt-skill');
  if (existsSync(tpPpt)) dirs.push(tpPpt);
  const tpHPpt = join(pluginRoot, 'ThirdParty', 'html-ppt-skill');
  if (existsSync(tpHPpt)) dirs.push(tpHPpt);
  return dirs;
}

function scanAllSkills(): SkillInfo[] {
  const result: SkillInfo[] = [];
  const dirs = findSkillDirs();
  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith('.')) continue;
        const skillDir = join(dir, e.name);
        const skillMd = join(skillDir, 'SKILL.md');
        if (!existsSync(skillMd)) continue;
        try {
          const content = readFileSync(skillMd, 'utf8');
          const fm = content.match(/^---\n([\s\S]*?)\n---/);
          let name = e.name;
          let zhName = e.name;
          let description = '';
          let category = 'other';
          if (fm) {
            const front = fm[1];
            name = (front.match(/^name:\s*(.+)$/m)?.[1] ?? e.name).trim();
            zhName = (front.match(/^zh_name:\s*(.+)$/m)?.[1] ?? front.match(/^description:\s*(.+)$/m)?.[1] ?? name).trim();
            description = (front.match(/^description:\s*(.+)$/m)?.[1] ?? '').trim();
            category = (front.match(/^category:\s*(.+)$/m)?.[1] ?? 'other').trim();
          }
          result.push({ name, zhName, description, category, path: skillDir });
        } catch { /* skip corrupt */ }
      }
    } catch { /* skip missing dir */ }
  }
  return result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

// ── Helpers ──────────────────────────────────────────
function getDocDirs(root: string): string[] {
  return ['doc', 'docs', 'document', 'documents'].filter((d) => existsSync(join(root, d)));
}

async function listDir(dir: string) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => !e.name.startsWith('.')).map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' as const : 'file' as const, path: relative(workspaceRoot, join(dir, e.name)) })).sort((a, b) => a.name.localeCompare(b.name));
  } catch { return []; }
}

async function scanDocFolders(root: string) {
  const dirs = getDocDirs(root);
  const result: { dirName: string; files: Awaited<ReturnType<typeof listDir>> }[] = [];
  for (const d of dirs) { const files = await listDir(join(root, d)); if (files.length > 0) result.push({ dirName: d, files }); }
  return result;
}

// ── HTTP handler ─────────────────────────────────────
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const p = url.pathname;
  const t = currentTheme;

  try {
    // Theme toggle
    if (p === '/api/theme') { currentTheme = url.searchParams.get('theme') ?? 'dark'; return Response.json({ theme: currentTheme }); }

    // Skill detail
    if (p.startsWith('/skills/') && p !== '/skills') {
      const name = decodeURIComponent(p.slice(8));
      const skills = scanAllSkills();
      const skill = skills.find((s) => s.name === name);
      if (!skill) return new Response(renderError('Skill not found', t), { status: 404, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
      const mdContent = existsSync(join(skill.path, 'SKILL.md')) ? readFileSync(join(skill.path, 'SKILL.md'), 'utf8') : '';
      const htmlContent = existsSync(join(skill.path, 'example.html')) ? readFileSync(join(skill.path, 'example.html'), 'utf8') : '';
      return new Response(renderSkillDetail(skill.zhName, mdContent, htmlContent, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    }

    // Doc file viewer
    if (p === '/docs/file') {
      const fpath = url.searchParams.get('path');
      if (!fpath) return new Response(renderError('Missing path', t), { status: 400, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
      const fullPath = join(workspaceRoot, fpath);
      if (!fullPath.startsWith(workspaceRoot) || !existsSync(fullPath)) return new Response(renderError('File not found', t), { status: 404, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
      const content = readFileSync(fullPath, 'utf8');
      return new Response(renderDocFile(fpath, content, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    }

    // Plan file viewer
    if (p === '/plans/file') {
      const fpath = url.searchParams.get('path');
      if (!fpath) return new Response(renderError('Missing path', t), { status: 400, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
      const fullPath = join(workspaceRoot, fpath);
      if (!fullPath.startsWith(workspaceRoot) || !existsSync(fullPath)) return new Response(renderError('File not found', t), { status: 404, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
      const content = readFileSync(fullPath, 'utf8');
      return new Response(renderPlanFile(fpath, content, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    }

    // Config read
    if (p === '/api/config/read') {
      const scope = url.searchParams.get('scope') ?? 'project';
      const cp = scope === 'project' ? join(workspaceRoot, '.opencode', 'extendai-lab.json') : resolve(process.env.APPDATA ?? homedir(), '.config', 'opencode', 'extendai-lab.json');
      try { return Response.json(JSON.parse(readFileSync(cp, 'utf8'))); } catch { return Response.json({ error: 'not found' }, { status: 404 }); }
    }

    // Config save
    if (p === '/api/config/save' && req.method === 'POST') {
      const body = await req.json() as { scope: string; config: Record<string, unknown> };
      const cp = body.scope === 'project' ? join(workspaceRoot, '.opencode', 'extendai-lab.json') : resolve(process.env.APPDATA ?? homedir(), '.config', 'opencode', 'extendai-lab.json');
      try { writeFileSync(cp + '.bak', existsSync(cp) ? readFileSync(cp, 'utf8') : '{}'); } catch {}
      await mkdir(dirname(cp), { recursive: true });
      await writeFile(cp, JSON.stringify(body.config, null, 2));
      return Response.json({ ok: true, message: 'Saved. Restart required.', path: cp });
    }

    // Pages
    if (p === '/' || p === '/dashboard') return new Response(renderDashboard({ sessions: 0 }, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    if (p === '/skills') return new Response(renderSkillsList(scanAllSkills(), t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    if (p === '/docs') { const docs = await scanDocFolders(workspaceRoot); return new Response(renderDocs(docs, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any); }
    if (p === '/plans') { const plans = await listDir(join(workspaceRoot, '.opencode', 'extendai-lab', 'plans')); return new Response(renderPlans(plans, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any); }
    if (p === '/config/project' || p === '/config/global') {
      const scope = p.includes('global') ? 'global' : 'project';
      const cp = scope === 'project' ? join(workspaceRoot, '.opencode', 'extendai-lab.json') : resolve(process.env.APPDATA ?? homedir(), '.config', 'opencode', 'extendai-lab.json');
      let config: Record<string, unknown> = {};
      try { config = JSON.parse(readFileSync(cp, 'utf8')); } catch {}
      return new Response(renderConfigEditor(config, scope, cp, t), { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any);
    }

    return new Response(renderError('Not found', t), { status: 404, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
  } catch (e) {
    return new Response(renderError(String(e), t), { status: 500, headers: { headers: { 'Content-Type': 'text/html; charset=utf-8' } } as any });
  }
}
const htmlInit = (_body: string) => ({ status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }) as any;

// ── MCP Tools ────────────────────────────────────────
const mcpTools: Tool[] = [
  { name: 'extendai_list_skills', description: 'List all available document/design skills', inputSchema: { type: 'object', properties: { category: { type: 'string' } } } },
  { name: 'extendai_read_plan', description: 'Read a saved plan', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
  { name: 'extendai_list_checkpoints', description: 'List session checkpoints', inputSchema: { type: 'object', properties: {} } },
  { name: 'extendai_dashboard_status', description: 'Get dashboard status', inputSchema: { type: 'object', properties: {} } },
];

// ═══════════════════════════════════════════════════════
async function main() {
  initLogger();
  const args = process.argv.slice(2);
  const ri = args.indexOf('--workspace');
  if (ri >= 0 && args[ri + 1]) workspaceRoot = resolve(args[ri + 1]);
  workspaceRoot = process.env.EXTENDAI_WORKSPACE ?? workspaceRoot;
  // Detect plugin root from dist/server/index.js location
  try { pluginRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..'); } catch {}

  await srvLog(`Starting. Workspace: ${workspaceRoot}, Plugin: ${pluginRoot}`);
  const skills = scanAllSkills();
  await srvLog(`Scanned ${skills.length} skills from ${findSkillDirs().length} directories`);

  const mcp = new McpServer({ name: 'extendai-lab', version: '1.0.0' }, { capabilities: { tools: {} } });
  mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: mcpTools }));
  mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    if (name === 'extendai_list_skills') return { content: [{ type: 'text' as const, text: JSON.stringify(scanAllSkills()) }] };
    if (name === 'extendai_read_plan') return { content: [{ type: 'text' as const, text: `View plans at http://${HOST}:${PORT}/plans` }] };
    if (name === 'extendai_list_checkpoints') return { content: [{ type: 'text' as const, text: `Checkpoints at http://${HOST}:${PORT}/dashboard` }] };
    if (name === 'extendai_dashboard_status') return { content: [{ type: 'text' as const, text: JSON.stringify({ workspace: workspaceRoot, skills: skills.length }) }] };
    return { content: [{ type: 'text' as const, text: `Unknown: ${name}` }], isError: true };
  });

  Bun.serve({ port: PORT, hostname: HOST, fetch: handleRequest });
  await srvLog(`HTTP: http://${HOST}:${PORT}`);

  const trans = new StdioServerTransport();
  await mcp.connect(trans);
  await srvLog('MCP connected');
}

main().catch(async (e) => { try { await srvLog(`FATAL: ${e}`); } catch {} console.error(e); process.exit(1); });

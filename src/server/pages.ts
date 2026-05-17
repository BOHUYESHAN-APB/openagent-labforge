/**
 * extendai-lab Web Dashboard — Complete rewrite
 *
 * Features: skill viewer with Markdown, HTML renderer,
 * theme toggle (dark/light), docs browser, config editor,
 * plan viewer.
 */
export function renderDashboard(props: { sessions: number; theme: string }): string {
  return base('Dashboard', `
    <h2>extendai-lab Dashboard</h2>
    <p class="s">Connected: ${props.sessions} sessions · Port 25569</p>
    <div class="row">
      <div class="box"><h3>Sessions</h3><p>${props.sessions} active</p></div>
      <div class="box"><h3>Skills</h3><p>75+ document & design skills</p></div>
      <div class="box"><h3>Config</h3><p>Edit project/global JSON</p></div>
      <div class="box"><h3>Document Parser</h3><p>If model lacks native doc parsing, use Python</p></div>
    </div>
  `, props.theme);
}

// ── Skills ───────────────────────────────────────────
interface SkillInfo { name: string; category: string; zhName: string; description: string; path: string }

export function renderSkillsList(skills: SkillInfo[], theme: string): string {
  const cats = [...new Set(skills.map((s) => s.category))];
  return base('Skills', `
    <h2>Skills Gallery</h2>
    <p class="s">${skills.length} skills · ${cats.length} categories</p>
    ${cats.map((cat) => `
      <h3 class="cat">${cat}</h3>
      <div class="row">
        ${skills.filter((s) => s.category === cat).map((s) => `
          <div class="box clickable" onclick="location='/skills/${encodeURIComponent(s.name)}'">
            <h4>${s.zhName || s.name}</h4>
            <p>${s.description}</p>
          </div>
        `).join('')}
      </div>
    `).join('')}
  `, theme);
}

export function renderSkillDetail(name: string, markdown: string, htmlExample: string, theme: string): string {
  return base(name, `
    <h2>${name}</h2>
    <div class="tabs" id="tabs">
      <button class="tab active" onclick="switchTab('md')">Markdown</button>
      <button class="tab" onclick="switchTab('html')">HTML Preview</button>
    </div>
    <div id="tab-md" class="tab-content">${md2html(markdown)}</div>
    <div id="tab-html" class="tab-content hidden">
      ${htmlExample ? `<iframe srcdoc="${escapeAttr(htmlExample)}" sandbox="allow-scripts allow-same-origin" style="width:100%;height:70vh;border:1px solid var(--border);border-radius:4px"></iframe>` : '<p>No HTML preview</p>'}
    </div>
    <script>
      function switchTab(name) {
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t=>t.classList.add('hidden'));
        document.getElementById('tab-'+name).classList.remove('hidden');
        event.target.classList.add('active');
      }
    </script>
  `, theme);
}

// ── Docs ─────────────────────────────────────────────
interface DocEntry { dirName: string; files: { name: string; type: 'file'|'dir'; path: string }[] }

export function renderDocs(docs: DocEntry[], theme: string): string {
  if (docs.length === 0) return base('Docs', '<h2>Docs</h2><p>No doc/docs/document/documents folders in workspace.</p>', theme);
  return base('Docs', `
    <h2>Document Browser</h2>
    ${docs.map((d) => `
      <h3 class="cat">/${d.dirName}</h3>
      <div class="row">
        ${d.files.map((f) => `
          <div class="box clickable" onclick="location='/docs/file?path=${encodeURIComponent(f.path)}'">
            <h4>${f.type === 'dir' ? '📁' : '📄'} ${f.name}</h4><p>${f.path}</p>
          </div>
        `).join('')}
      </div>
    `).join('')}
  `, theme);
}

export function renderDocFile(path: string, content: string, theme: string): string {
  const isMd = path.endsWith('.md');
  const isHtml = path.endsWith('.html') || path.endsWith('.htm');
  return base(path, `
    <h2>${path}</h2>
    ${isHtml ? `<iframe srcdoc="${escapeAttr(content)}" sandbox="allow-scripts allow-same-origin" style="width:100%;height:80vh;border:1px solid var(--border);border-radius:4px"></iframe>` : isMd ? md2html(content) : `<pre style="white-space:pre-wrap;font:13px monospace;background:var(--bg2);padding:16px;border-radius:4px">${escapeHtml(content)}</pre>`}
  `, theme);
}

// ── Plans ────────────────────────────────────────────
interface PlanEntry { name: string; type: 'file'|'dir'; path: string }

export function renderPlans(plans: PlanEntry[], theme: string): string {
  if (plans.length === 0) return base('Plans', '<h2>Plans</h2><p>No saved plans.</p>', theme);
  return base('Plans', `
    <h2>Plans</h2>
    <div class="row">
      ${plans.map((p) => `<div class="box clickable" onclick="location='/plans/file?path=${encodeURIComponent(p.path)}'"><h4>${p.name}</h4><p>${p.path}</p></div>`).join('')}
    </div>
  `, theme);
}

export function renderPlanFile(path: string, content: string, theme: string): string {
  return base(path, `<h2>${path}</h2>` + md2html(content), theme);
}

// ── Config Editor ────────────────────────────────────
export function renderConfigEditor(config: Record<string, unknown>, scope: string, configPath: string, theme: string): string {
  const fields = Object.entries(config)
    .map(([k, v]) => renderField(k, v))
    .join('');
  return base(`Config (${scope})`, `
    <h2>Config Editor · ${scope}</h2>
    <p class="s">Path: ${configPath}</p>
    <form id="cf" onsubmit="saveConfig(event,'${scope}')">
      ${fields}
      <button type="submit">Save (restart required)</button>
    </form>
    <div id="st"></div>
    <script>
      async function saveConfig(e,s){e.preventDefault();const d=new FormData(document.getElementById('cf'));const c={};for(const[k,v]of d.entries()){try{c[k]=JSON.parse(v)}catch{c[k]=v==='true'?true:v==='false'?false:v}}
      const r=await fetch('/api/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:s,config:c})});const j=await r.json();const el=document.getElementById('st');el.textContent=j.ok?j.message:'Error: '+j.error;el.style.color=j.ok?'var(--ok)':'var(--err)'}
    </script>
  `, theme);
}

function renderField(key: string, val: unknown): string {
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (typeof val === 'boolean') return `<label>${label}<br><select name="${key}"><option value="true"${val?' selected':''}>Yes</option><option value="false"${!val?' selected':''}>No</option></select></label>`;
  if (typeof val === 'string') return `<label>${label}<br><input name="${key}" value="${escapeAttr(val as string)}"></label>`;
  if (typeof val === 'object') return `<label>${label}<br><textarea name="${key}" rows="6">${escapeHtml(JSON.stringify(val, null, 2))}</textarea></label>`;
  return `<label>${label}<br><input name="${key}" value="${escapeAttr(String(val))}"></label>`;
}

// ── Error ────────────────────────────────────────────
export function renderError(msg: string, theme: string): string {
  return base('Error', `<h2>Error</h2><p class="err">${msg}</p>`, theme);
}

// ── Helpers ──────────────────────────────────────────
function base(title: string, body: string, theme: string): string {
  return `<!DOCTYPE html><html lang="zh-CN" data-theme="${theme}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · extendai-lab</title><style>${CSS}</style></head><body><nav><a href="/">Home</a><a href="/skills">Skills</a><a href="/docs">Docs</a><a href="/plans">Plans</a><a href="/config/project">Config</a><button class="btn-theme" onclick="toggleTheme()" title="Toggle theme">${theme === 'dark' ? '☀' : '☾'}</button></nav><main>${body}<script>function toggleTheme(){const h=document.documentElement;const t=h.dataset.theme==='dark'?'light':'dark';h.dataset.theme=t;fetch('/api/theme?theme='+t);location.reload()}</script></main></body></html>`;
}

function md2html(md: string): string {
  let out = md;
  // Code blocks
  out = out.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="lang-${lang}">${escapeHtml(code.trim())}</code></pre>`);
  // Headings
  out = out.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  out = out.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  out = out.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  out = out.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold / italic
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Images
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');
  // HR
  out = out.replace(/^---$/gm, '<hr>');
  // Blockquote
  out = out.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Unordered lists
  out = out.replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>');
  out = out.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul>${m}</ul>`);
  // Tables
  out = out.replace(/^\|(.+)\|$/gm, (line, cells) => {
    const tds = cells.split('|').map((c: string) => c.trim().replace(/^[-: ]+$/, ''));
    return tds.every((c: string) => c === '') ? '' : `<tr>${tds.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
  });
  out = out.replace(/(<tr>[\s\S]*?<\/tr>)/g, (m) => {
    if (m.includes('<td>') && !m.includes('---')) return `<table>${m}</table>`;
    return m;
  });
  // Paragraphs
  out = out.replace(/\n\n+/g, '</p><p>');
  out = '<p>' + out + '</p>';
  // Clean up
  out = out.replace(/<p>\s*<\/p>/g, '');
  out = out.replace(/<\/table>\s*<table>/g, '');
  out = out.replace(/<p><(h[1-4]|ul|ol|pre|table|blockquote|hr)/g, '<$1');
  out = out.replace(/<\/(h[1-4]|ul|ol|pre|table|blockquote|hr)><\/p>/g, '</$1>');
  return out;
}

// ── CSS ──────────────────────────────────────────────
const CSS = `
:root{--bg:#0d1117;--bg2:#161b22;--fg:#c9d1d9;--fg2:#f0f6fc;--link:#58a6ff;--border:#30363d;--ok:#3fb950;--err:#f85149;--s:#8b949e}
[data-theme="light"]{--bg:#fff;--bg2:#f6f8fa;--fg:#1f2328;--fg2:#1f2328;--link:#0969da;--border:#d0d7de;--s:#656d76}
*{margin:0;padding:0;box-sizing:border-box}
body{font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--fg)}
nav{position:sticky;top:0;z-index:10;background:var(--bg2);padding:10px 20px;display:flex;gap:16px;align-items:center;border-bottom:1px solid var(--border)}
nav a{color:var(--link);text-decoration:none;font-weight:500}
.btn-theme{margin-left:auto;background:none;border:1px solid var(--border);color:var(--fg);padding:4px 10px;border-radius:4px;cursor:pointer;font-size:16px}
main{padding:24px;max-width:1200px;margin:0 auto}
h2{font-size:20px;margin-bottom:16px;color:var(--fg2)}
h3{font-size:16px;margin:16px 0 8px;color:var(--fg2)}
h3.cat{text-transform:uppercase;font-size:13px;color:var(--s);margin-top:24px;padding-bottom:4px;border-bottom:1px solid var(--border)}
h4{font-size:14px;margin-bottom:4px}
p{line-height:1.6}
.s{color:var(--s);font-size:13px;margin-bottom:16px}
.err{color:var(--err)}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px}
.box{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:14px}
.box.clickable{cursor:pointer;transition:border-color .15s}
.box.clickable:hover{border-color:var(--link)}
.box h4{color:var(--link)}
.box p{color:var(--s);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
label{display:block;margin-bottom:12px;color:var(--fg);font-size:13px}
input,select,textarea{width:100%;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--fg);font:inherit;font-size:13px}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--link)}
button{padding:8px 16px;background:#238636;color:#fff;border:none;border-radius:4px;cursor:pointer;font:inherit;font-size:13px}
button:hover{opacity:.9}
pre{background:var(--bg);padding:14px;border-radius:4px;overflow-x:auto;font:13px "Cascadia Code",Consolas,monospace;border:1px solid var(--border);margin:8px 0}
code{font:13px "Cascadia Code",Consolas,monospace;background:var(--bg2);padding:1px 5px;border-radius:3px}
pre code{background:none;padding:0}
blockquote{border-left:3px solid var(--link);padding:8px 14px;margin:8px 0;background:var(--bg2);border-radius:0 4px 4px 0}
table{border-collapse:collapse;width:100%;margin:8px 0}
td{padding:6px 10px;border:1px solid var(--border);font-size:13px}
hr{border:none;border-top:1px solid var(--border);margin:16px 0}
ul,ol{padding-left:20px;margin:8px 0}
li{line-height:1.7}
img{max-width:100%;border-radius:4px}
.tabs{margin-bottom:16px;display:flex;gap:0}
.tab{padding:8px 16px;background:var(--bg2);border:1px solid var(--border);border-bottom:none;border-radius:4px 4px 0 0;color:var(--s);cursor:pointer;font-size:13px}
.tab.active{background:var(--bg);color:var(--fg2)}
.tab-content{padding:16px;background:var(--bg);border:1px solid var(--border);border-radius:0 4px 4px 4px;min-height:200px}
.hidden{display:none}
iframe{display:block}
a{color:var(--link)}
`;

// ── Export helpers ───────────────────────────────────
export { escapeAttr, escapeHtml, md2html };

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

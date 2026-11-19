/* Static import lint. The concatenated test bundle shares one scope, so a
   module referencing another module's binding without importing it still
   resolves there — and only fails in a real browser as a ReferenceError
   (this shipped once: track.js used MTMScenery without importing it).
   This check enforces real ES-module discipline without executing anything:
   every cross-file reference to an exported binding must be imported. */
const fs=require('fs'),assert=require('node:assert/strict');
const root=__dirname+'/../src';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.js')&&f!=='three.min.js');
const srcOf={};
for(const f of files)srcOf[f]=fs.readFileSync(root+'/'+f,'utf8');

// Exported bindings per file.
const exported={};
for(const [f,s] of Object.entries(srcOf)){
  const names=new Set();
  for(const m of s.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g))names.add(m[1]);
  for(const m of s.matchAll(/export\s*\{([^}]+)\}/g))m[1].split(',').forEach(n=>names.add(n.trim().split(/\s+as\s+/).pop().trim()));
  exported[f]=names;
}
const allExported=new Map();
for(const [f,names] of Object.entries(exported))for(const n of names)allExported.set(n,f);

// Bindings imported by each file.
const importsOf={};
for(const [f,s] of Object.entries(srcOf)){
  const names=new Set();
  for(const m of s.matchAll(/import\s*\{([^}]+)\}\s*from/g))m[1].split(',').forEach(n=>names.add(n.trim().split(/\s+as\s+/).pop().trim()));
  for(const m of s.matchAll(/import\s+(\w+)\s+from/g))names.add(m[1]);
  for(const m of s.matchAll(/import\s*\*\s*as\s+(\w+)/g))names.add(m[1]);
  importsOf[f]=names;
}

const problems=[];
for(const [f,s] of Object.entries(srcOf)){
  // Every referenced MTM* binding must be imported or declared locally.
  for(const m of s.matchAll(/\b(MTM[A-Z]\w+)\b/g)){
    const n=m[1];
    if(importsOf[f].has(n))continue;
    if(new RegExp('(const|let|var|function|class)\\s+'+n+'\\b').test(s))continue;
    problems.push(`${f}: references ${n} without importing it (exported by ${allExported.get(n)||'nowhere'})`);
  }
  // Every non-MTM exported binding referenced across files must be imported too.
  for(const [n,owner] of allExported){
    if(n.startsWith('MTM'))continue; // covered above
    if(owner===f||importsOf[f].has(n))continue;
    if(new RegExp('\\b'+n+'\\b').test(s)&&!new RegExp('(const|let|var|function|class)\\s+'+n+'\\b').test(s))
      problems.push(`${f}: references ${n} without importing it (exported by ${owner})`);
  }
  // No top-level name declared in two files (the old concatenation allowed
  // accidental shadowing across files; modules make that a redeclaration).
}
const decl={};
for(const [f,s] of Object.entries(srcOf))
  for(const m of s.matchAll(/^(?:const|let|var|function|class)\s+(\w+)/gm))(decl[m[1]]=decl[m[1]]||new Set()).add(f);
for(const [n,owners] of Object.entries(decl))
  if(owners.size>1)problems.push(`top-level ${n} declared in ${[...owners].join(', ')}`);

assert.equal(problems.length,0,problems.join('\n'));
console.log('imports: every module binds what it references; no cross-file implicit globals');

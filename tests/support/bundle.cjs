/* The vm-based tests run the game sources inside a CommonJS-friendly sandbox.
   Production ships real ES modules; this helper strips the import/export
   statements and concatenates the sources in the caller's dependency order,
   which is the same order tools/build.py uses for dist. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..', 'src');

function stripped(name) {
  let src = fs.readFileSync(path.join(root, name + '.js'), 'utf8');
  src = src.replace(/^import \{[^}]*\} from '\.\/[a-z-]+\.js';\n/gm, '');
  src = src.replace(/^export \{[^}]*\};\n/gm, '');
  src = src.replace(/^export const /gm, 'const ');
  return src;
}

function source(names, omit = []) {
  return names.filter(n => !omit.includes(n)).map(stripped).join('\n');
}

function run(names, omit) {
  vm.runInThisContext(source(names, omit));
}

module.exports = { source, run, stripped };

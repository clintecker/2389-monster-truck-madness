"""Assemble the multi-file distribution: game modules, assets and index page."""
import base64
import shutil
from pathlib import Path

project = Path(__file__).resolve().parents[1]
root = project / 'src'
output = project / 'dist'

if output.exists():
    shutil.rmtree(output)
output.mkdir(parents=True)

# Every runtime file ships as-is. The HTML shell stays a build input, not an asset.
for pattern in ['*.js', '*.woff', '*.webp']:
    for src in root.glob(pattern):
        shutil.copy2(src, output / src.name)

# software.js keeps a /*__WASM__*/ placeholder in the source tree so tests can
# swap in a fresh raster build; the distribution embeds the compiled bytes.
software = output / 'software.js'
software.write_text(software.read_text().replace(
    '/*__WASM__*/', base64.b64encode((root / 'raster.wasm').read_bytes()).decode()))
shutil.copy2(root / 'raster.wasm', output / 'raster.wasm')

# Third-party notices ride along with the distribution.
for name in ['THREE-LICENSE.txt', 'OFL-Barlow.txt', 'OFL-BarlowCondensed.txt', 'OFL-Plex.txt', 'OFL-Outfit.txt', 'SKY-CREDITS.txt']:
    shutil.copy2(root / name, output / name)

css = (root / 'style.css').read_text()
shell = (root / 'interface.html').read_text()
page = shell.replace('/*__STYLES__*/', css)
(output / 'index.html').write_text(page, encoding='utf-8', newline='\n')

# Response headers applied by Workers Static Assets (never uploaded as an asset
# itself). Kept to headers that are safe without a full CSP audit.
(output / '_headers').write_text(
    '/*\n'
    '  X-Content-Type-Options: nosniff\n'
    '  Referrer-Policy: no-referrer\n',
    encoding='utf-8', newline='\n')

size = sum(f.stat().st_size for f in output.rglob('*') if f.is_file())
print(f'{output} ({size:,} bytes, {len(list(output.iterdir()))} files)')

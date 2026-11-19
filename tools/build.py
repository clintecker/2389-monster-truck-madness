"""Assemble all executable code, art, fonts, and notices into a file://-safe page."""
from base64 import b64encode
from pathlib import Path

project = Path(__file__).resolve().parents[1]
root = project / 'src'
output = project / 'dist' / 'index.html'
def data(name, mime):
    return f'data:{mime};base64,' + b64encode((root / name).read_bytes()).decode()

fonts = [('Body','normal',500,'body'),('Body','normal',700,'bold'),('Mono','normal',500,'mono'),('Cond','normal',700,'cond'),('Display','italic',900,'display'),('Brand','normal',800,'brand')]
font_css = '\n'.join(f"@font-face{{font-family:{family};font-style:{style};font-weight:{weight};font-display:swap;src:url('{data(name+'.woff','font/woff')}') format('woff');}}" for family,style,weight,name in fonts)
css = (root / 'style.css').read_text().replace('/*__FONTS__*/',font_css).replace('/*__COVER__*/',data('cover-night.webp','image/webp'))
for truck in ['digger','snake','crusher','mux','orrery','soloclaw']:
    css = css.replace('/*__COVER_'+truck+'__*/',data('cover-'+truck+'.webp','image/webp'))
for track in ['arizona','eight','indiana','packet-pass','dead-letter','context-window']:
    css = css.replace('/*__CARD_'+track+'__*/',data('tile-'+track+'.webp','image/webp'))
three = (root / 'three.min.js').read_text()
# The bundled UMD build is intentionally inline to support file:// with no module loader.
three = 'void ' + three[three.index('/**'):] if three.startswith('console.warn(') and '/**' in three[:600] else three
modules = ['trucks','scenery','audio','fitment-sprites','course','celestial','finish','track','world','contact','physics','motion','props','soilart','oddities','midway-mesa','midway-loop','midway-strip','sponsor-art','neon-art','lcd-art','holo-art','project-fair','midway','salvage-art','parade-art','carnival','electric','crowd','software','view','app']
code = '\n'.join((root / (name+'.js')).read_text() for name in modules)
code = code.replace('/*__WASM__*/',b64encode((root / 'raster.wasm').read_bytes()).decode())
notices = '\n\n'.join((root / name).read_text() for name in ['THREE-LICENSE.txt','OFL-Barlow.txt','OFL-BarlowCondensed.txt','OFL-Plex.txt','OFL-Outfit.txt','SKY-CREDITS.txt'])
# The small original HTML shell also lets the Save offline link reproduce the
# exact distribution without fetching the current URL or serializing a live race.
shell = (root / 'interface.html').read_text()
code = code.replace('/*__PAGE_TEMPLATE__*/', b64encode(shell.encode()).decode())
page = (shell.replace('/*__STYLES__*/', css)
            .replace('/*__ENGINE__*/', three)
            .replace('/*__GAME__*/', code)
            .replace('/*__NOTICES__*/', notices))
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(page,encoding='utf-8',newline='\n');print(f'{output} ({output.stat().st_size:,} bytes)')

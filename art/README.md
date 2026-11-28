# art/ -- original art for turning into GD objects

`src/*.svg`: drawings made for this project (Claude, 2026-11-28), free to use here. Only our own or free-licensed art goes
in this folder (CC0, or CC-BY with its credit line next to the file) -- never copyrighted pictures.
Moving parts are separate files or `<g id="...">` groups, so triggers can move them (tools/svg2gd.js keeps the id as `part`).
Use: `node tools/svg2gd.js art/src/demon_face.svg --preview out.png`; ART.md "Creatures and animation".

// Post-export patch for the web build (output: "single" uses a fixed HTML
// shell that ignores app/+html.tsx). Forces English and disables browser
// auto-translation so users in other locales see the app as written.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/<html\b([^>]*)>/i, (m, attrs) =>
  /translate=/.test(attrs) ? m : `<html${attrs} lang="en" translate="no">`,
);
if (!/name="google"\s+content="notranslate"/.test(html)) {
  html = html.replace(/<\/head>/i, '    <meta name="google" content="notranslate" />\n  </head>');
}
html = html.replace(/<body\b([^>]*)>/i, (m, attrs) =>
  /class=/.test(attrs) ? m : '<body class="notranslate"' + attrs + '>',
);

fs.writeFileSync(file, html);
console.log('Patched dist/index.html: forced lang=en + disabled auto-translation.');

// Quill initialization
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: '#toolbar'
  }
});

const sanitizeBtn = document.getElementById('sanitizeBtn');
const copyBtn = document.getElementById('copyBtn');
const outputDiv = document.getElementById('output');

const options = {
  get removeZeroWidth() { return document.getElementById('removeZeroWidth').checked; },
  get removeBidi() { return document.getElementById('removeBidi').checked; },
  get normalizeSpaces() { return document.getElementById('normalizeSpaces').checked; },
  get collapseBlankLines() { return document.getElementById('collapseBlankLines').checked; },
};

// --- Core sanitization logic ------------------------------------

function sanitizeTextContent(text, opts) {
  if (typeof text.normalize === 'function') {
    text = text.normalize('NFC');
  }

  if (opts.removeZeroWidth) {
    text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  }

  if (opts.removeBidi) {
    text = text.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');
  }

  if (opts.normalizeSpaces) {
    text = text.replace(/[\u00A0\u202F]/g, ' ');
  }

  // Normalize all dash-like characters to simple hyphen
  text = text.replace(/[\u2014\u2013\u2015\u2212\u2012]/g, '-');

  // collapse multiple hyphens (--- or --)
  text = text.replace(/-{2,}/g, '-');

  return text;
}

function sanitizeHtmlPreservingFormatting(html, opts) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node) {
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.nodeValue = sanitizeTextContent(child.nodeValue, opts);
      } else {
        walk(child);
      }
    });
  }

  walk(doc.body);

  let cleanedHtml = doc.body.innerHTML;

  if (opts.collapseBlankLines) {
    cleanedHtml = cleanedHtml
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  return cleanedHtml;
}

// --- Events -----------------------------------------------------

sanitizeBtn.addEventListener('click', () => {
  const html = quill.root.innerHTML;
  const cleanedHtml = sanitizeHtmlPreservingFormatting(html, options);
  outputDiv.innerHTML = cleanedHtml;
});

copyBtn.addEventListener('click', () => {
  const temp = document.createElement('textarea');
  temp.value = outputDiv.innerHTML;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
  alert('Sanitized HTML copied to clipboard');
});

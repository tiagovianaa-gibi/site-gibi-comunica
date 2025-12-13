const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

marked.setOptions({ gfm: true, breaks: true });

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const SITE_URL = 'https://gibicomunica.com.br';
const DEFAULT_OG = `${SITE_URL}/assets/social-share.jpg`;

const COPY_SKIP = new Set(['public', 'node_modules', 'content', 'scripts', 'blog']);

const readFile = (filePath) => fs.readFile(filePath, 'utf8');

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const renderHead = ({ title, description, canonical, ogImage = DEFAULT_OG, type = 'website' }) => `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#f97316">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
</head>`;

const extractBlock = (html, tag) => {
  const match = html.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'));
  return match ? match[0] : null;
};

const buildHeader = (homeHtml) => {
  const brand = (homeHtml.match(/<a[^>]*class="brand"[^>]*>[\s\S]*?<\/a>/i) || [null])[0];
  const nav = extractBlock(homeHtml, 'nav');

  if (brand || nav) {
    return `<header class="site-header" id="topo"><div class="container header-inner">${brand || ''}${nav || ''}</div></header>`;
  }

  return `<header class="site-header" id="topo">
  <div class="container header-inner">
    <a class="brand" href="/"><span class="brand-text">Gibi Comunica</span></a>
    <nav class="nav"><ul class="nav-menu"><li><a href="/">Inicial</a></li><li><a href="/blog/">Blog</a></li></ul></nav>
  </div>
</header>`;
};

const buildFooter = (homeHtml) =>
  extractBlock(homeHtml, 'footer') ||
  `<footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; <span id="year"></span> Gibi Comunica.</p>
    </div>
  </footer>`;

const loadLayoutPieces = async () => {
  const homeHtml = await readFile(path.join(ROOT, 'index.html'));
  return {
    header: buildHeader(homeHtml),
    footer: buildFooter(homeHtml),
  };
};

const collectPosts = async () => {
  const exists = await fs.pathExists(CONTENT_DIR);
  if (!exists) return [];

  const files = (await fs.readdir(CONTENT_DIR)).filter((file) => file.endsWith('.md'));

  const posts = [];
  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = await readFile(fullPath);
    const { data, content } = matter(raw);
    const slug = path.basename(file, path.extname(file));
    const date = data.date ? new Date(data.date) : null;
    const dateValue = date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;

    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      dateValue,
      formattedDate: dateValue ? formatDate(dateValue) : '',
      tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
      featuredImage: data.featured_image || '',
      html: marked.parse(content),
    });
  }

  return posts.sort((a, b) => b.dateValue - a.dateValue);
};

const ensureDir = async (dirPath) => fs.ensureDir(dirPath);

const renderLayout = ({ head, header, footer, body, scripts = '' }) => `${head}
<body>
  <a href="#conteudo-principal" class="skip-link">Ir para o conteúdo principal</a>
  ${header}
  ${body}
  ${footer}
  <script src="/js/main.js"></script>
  ${scripts}
</body>
</html>`;

const renderListPage = ({ posts, header, footer }) => {
  const cards =
    posts.length === 0
      ? '<p class="card">Nenhum post publicado ainda.</p>'
      : posts
          .map((post) => {
            const meta = [post.formattedDate, post.tags.length ? post.tags.join(' · ') : '']
              .filter(Boolean)
              .join(' · ');
            return `<article class="card blog-card">
  ${meta ? `<p class="blog-meta">${meta}</p>` : ''}
  <h2><a class="blog-link" href="/blog/${post.slug}/">${escapeHtml(post.title)}</a></h2>
  <p>${escapeHtml(post.description)}</p>
</article>`;
          })
          .join('\n');

  const body = `<main id="conteudo-principal">
  <section class="section">
    <div class="container">
      <p class="hero-kicker">Blog</p>
      <h1>Últimos artigos</h1>
      <p>Conteúdos sobre imprensa, redes, audiovisual e gestão de temporada no DF.</p>
      <div class="grid grid-two" style="margin-top:1.5rem;">
        ${cards}
      </div>
    </div>
  </section>
</main>`;

  const head = renderHead({
    title: 'Blog | Gibi Comunica',
    description: 'Artigos sobre comunicação cultural, imprensa, redes e audiovisual no DF.',
    canonical: `${SITE_URL}/blog/`,
    ogImage: DEFAULT_OG,
    type: 'website',
  });

  return renderLayout({ head, header, footer, body });
};

const renderPostPage = ({ post, header, footer }) => {
  const imageBlock = post.featuredImage
    ? `<figure class="post-cover"><img src="${post.featuredImage}" alt="${escapeHtml(post.title)}"></figure>`
    : '';
  const tagLine = post.tags.length ? post.tags.join(' · ') : '';

  const body = `<main id="conteudo-principal">
  <section class="section">
    <div class="container">
      <p class="hero-kicker">Blog</p>
      <p class="blog-meta">${[post.formattedDate, tagLine].filter(Boolean).join(' · ')}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="lead">${escapeHtml(post.description)}</p>
      ${imageBlock}
      <article class="post-body markdown">${post.html}</article>
      <p class="blog-link" style="margin-top:1.5rem;"><a href="/blog/">&larr; Voltar para o blog</a></p>
    </div>
  </section>
</main>`;

  const ogImage = post.featuredImage
    ? post.featuredImage.startsWith('http')
      ? post.featuredImage
      : `${SITE_URL}${post.featuredImage}`
    : DEFAULT_OG;

  const head = renderHead({
    title: `${post.title} | Blog Gibi Comunica`,
    description: post.description || 'Conteúdo do blog Gibi Comunica.',
    canonical: `${SITE_URL}/blog/${post.slug}/`,
    ogImage,
    type: 'article',
  });

  return renderLayout({ head, header, footer, body });
};

const copyStaticSite = async () => {
  await fs.remove(PUBLIC_DIR);
  await ensureDir(PUBLIC_DIR);

  await fs.copy(ROOT, PUBLIC_DIR, {
    filter: (src) => {
      const rel = path.relative(ROOT, src);
      if (!rel || rel === '') return true;
      const parts = rel.split(path.sep);
      if (parts[0].startsWith('.git')) return false;
      if (COPY_SKIP.has(parts[0])) return false;
      return true;
    },
  });
};

const build = async () => {
  const { header, footer } = await loadLayoutPieces();
  const posts = await collectPosts();

  await copyStaticSite();
  await ensureDir(path.join(PUBLIC_DIR, 'blog'));

  const listHtml = renderListPage({ posts, header, footer });
  await fs.writeFile(path.join(PUBLIC_DIR, 'blog', 'index.html'), listHtml);

  for (const post of posts) {
    const postDir = path.join(PUBLIC_DIR, 'blog', post.slug);
    await ensureDir(postDir);
    const postHtml = renderPostPage({ post, header, footer });
    await fs.writeFile(path.join(postDir, 'index.html'), postHtml);
  }

  console.log(`Gerados ${posts.length} posts em /public/blog`);
};

build().catch((error) => {
  console.error('Erro ao gerar blog:', error);
  process.exit(1);
});

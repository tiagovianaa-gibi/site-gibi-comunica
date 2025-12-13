# CHANGELOG

## 2025-12-13
- Adicionado painel Decap CMS em `/admin` com configuração Git Gateway e upload em `/assets/uploads`.
- Criada estrutura de conteúdo em `content/blog` com post de exemplo em Markdown e placeholder de uploads.
- Implementado script `scripts/build-blog.cjs` (gray-matter, marked, fs-extra) que copia o site para `/public` e gera lista de posts e páginas individuais com layout do site.
- Configurado deploy via Netlify (`netlify.toml`) e scripts npm (`build`, `dev:cms`).
- Página antiga do blog preservada em `blog/blog-old.html` para referência.

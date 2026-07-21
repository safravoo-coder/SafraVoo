// netlify/functions/sitemap.js
// Gera o sitemap.xml dinamicamente a partir das empresas cadastradas no Airtable

exports.handler = async function (event, context) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const TABELA_EMPRESAS = 'Empresas';
  const SITE_URL = 'https://safravoo.com.br';

  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600' // cache de 1h, reduz chamadas ao Airtable
  };

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABELA_EMPRESAS}`;

    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!resposta.ok) {
      throw new Error(`Erro na API: ${resposta.status}`);
    }

    const dados = await resposta.json();

    // Pega só os slugs válidos das empresas
    const slugsEmpresas = dados.records
      .map(record => record.fields.slug)
      .filter(Boolean);

    // URLs fixas do site (adicione outras páginas institucionais aqui se existirem)
    const urlsEstaticas = [''];

    // URLs de perfil de empresa
    const urlsEmpresas = slugsEmpresas.map(slug => `/empresa/${slug}`);

    const todasUrls = [...urlsEstaticas, ...urlsEmpresas];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      todasUrls
        .map(
          path =>
            `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`
        )
        .join('\n') +
      `\n</urlset>`;

    return {
      statusCode: 200,
      headers,
      body: xml
    };
  } catch (erro) {
    console.error('Erro ao gerar sitemap:', erro);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Erro ao gerar sitemap'
    };
  }
};


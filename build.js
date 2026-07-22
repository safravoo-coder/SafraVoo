// build.js
// Roda automaticamente a cada deploy (configurado como "Build command" na Netlify).
// Busca as empresas no Airtable e gera o HTML já pronto (home + perfis) dentro de /dist,
// que passa a ser a "Publish directory" do site.

const fs = require('fs');
const path = require('path');

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const TABELA_EMPRESAS = 'Empresas';
const SITE_URL = 'https://safravoo.com.br';

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// ════════════════════════════════════════════════════════
// LISTA DE SERVIÇOS (mesma do script.js, usada só para
// renderizar os botões de filtro na home)
// ════════════════════════════════════════════════════════

const SERVICOS = [
  { id: 'pulverizacao', nome: 'Pulverização' },
  { id: 'mapeamento', nome: 'Mapeamento' },
  { id: 'monitoramento', nome: 'Monitoramento' },
  { id: 'dispersao', nome: 'Dispersão de Sólidos' }
];

// ════════════════════════════════════════════════════════
// ÍCONES SVG (copiados do script.js/perfil.html para manter
// a aparência idêntica ao que já existe hoje)
// ════════════════════════════════════════════════════════

const LOC_ICON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;

// Ícones específicos do card de "Destaque" (diferentes do LOC_ICON acima — copiados
// exatamente do renderDestaques() do script.js)
const SVG_LOC_DEST = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const SVG_STAR_DEST = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

// Ícones específicos do perfil.html (LOC_ICON local é ligeiramente diferente —
// sem stroke-linecap/linejoin — e os ícones de estatística/botões só existem lá)
const LOC_ICON_PERFIL = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
const SVG_STAR_STAT = `<svg width="26" height="26" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SVG_CLIPBOARD = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.8"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>`;
const SVG_SHIELD_STAT = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
const SVG_WPP = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;
const SVG_ORC = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const SVG_VER_PERFIL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

const SVG_DRONE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5.5h4"/><path d="M16.5 5.5h4"/><path d="M5.5 5.5v2"/><path d="M18.5 5.5v2"/><path d="M5.5 7.5h4"/><path d="M14.5 7.5h4"/><path d="M9.5 7.5l1.8 2.5"/><path d="M14.5 7.5L12.7 10"/><rect x="9" y="10" width="6" height="4" rx="1.6"/><rect x="10.5" y="8" width="3" height="1.3" rx=".4"/><path d="M10 14l-1 3"/><path d="M14 14l1 3"/><path d="M8.7 17h2"/><path d="M13.3 17h2"/><path d="M5.5 9.2v2"/><path d="M18.5 9.2v2"/><path d="M4.8 12.2l-.5 1"/><path d="M5.5 12.2v1.6"/><path d="M6.2 12.2l.5 1"/><path d="M17.8 12.2l-.5 1"/><path d="M18.5 12.2v1.6"/><path d="M19.2 12.2l.5 1"/></svg>`;

const SVG_SHIELD = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;

// Estrelas específicas do perfil (12x12, só cheia/vazia — copiadas exatamente
// da função "gerarEstrelas" dentro do perfil.html original)
const SVG_STAR_FULL_PERFIL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SVG_STAR_EMPTY_PERFIL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#E5E7EB" stroke="#E5E7EB" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

function gerarEstrelas(nota) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += (nota >= i) ? SVG_STAR_FULL_PERFIL : SVG_STAR_EMPTY_PERFIL;
  }
  return html;
}

// ════════════════════════════════════════════════════════
// SUBSTITUIÇÃO SEGURA DE PLACEHOLDERS
// ════════════════════════════════════════════════════════
// Usamos split/join em vez de .replace() porque .replace() trata "$" de forma
// especial (ex: "$&", "$1") na string de substituição. Como os dados vêm do
// Airtable (bios, preços em "R$", etc.), qualquer "$" ali poderia corromper o
// HTML gerado se usássemos .replace() diretamente.

function preencherTemplate(template, valores) {
  let resultado = template;
  for (const [chave, valor] of Object.entries(valores)) {
    resultado = resultado.split(`{{${chave}}}`).join(String(valor));
  }
  return resultado;
}



// ════════════════════════════════════════════════════════
// BUSCAR EMPRESAS NO AIRTABLE (mesma lógica do empresas.js)
// ════════════════════════════════════════════════════════

async function buscarEmpresas() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABELA_EMPRESAS}`;
  const resposta = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar Airtable: ${resposta.status}`);
  }

  const dados = await resposta.json();

  return dados.records.map(record => ({
    id: record.id,
    slug: record.fields.slug || record.id,
    nome: record.fields.nome || '',
    foto: record.fields.foto || '',
    cidade: record.fields.cidade || '',
    estado: record.fields.estado || '',
    avaliacao: record.fields.avaliacao || 0,
    avaliacoes: record.fields.avaliacoes || 0,
    drone: record.fields.drone || '',
    area_max: record.fields.area_max || 0,
    culturas: Array.isArray(record.fields.culturas) ? record.fields.culturas : [],
    disponivel: !!record.fields.disponivel,
    destaque: !!record.fields.destaque,
    servicos: record.fields.servicos || 0,
    bio: record.fields.bio || '',
    orcamento: record.fields.orcamento || '',
    link_perfil: record.fields.link_perfil || '',
    experiencia: record.fields.experiencia || 0,
    whatsapp: record.fields.whatsapp || ''
  }));
}

// ════════════════════════════════════════════════════════
// GERADORES DE HTML (cards, mesma aparência do script.js)
// ════════════════════════════════════════════════════════

function avatarImg(p) {
  return p.foto ? `<img src="${p.foto}" alt="${p.nome}">` : '';
}

function cardDestaqueHtml(p) {
  return `
    <div class="card-dest" onclick="abrirPerfil('${p.slug}')">
      <div class="card-dest-top">${avatarImg(p)}</div>
      <div class="card-dest-bottom">
        <div class="card-dest-main">
          <div class="card-dest-texto">
            <div class="card-dest-nome">${p.nome}</div>
            <div class="card-dest-cidad">${SVG_LOC_DEST} ${p.cidade}</div>
          </div>
          <div class="card-dest-avaliacao">
            <div class="card-dest-star-ico">${SVG_STAR_DEST}</div>
            <div class="card-dest-nota">${p.avaliacao}</div>
          </div>
        </div>
        <div class="card-dest-info">${SVG_DRONE}<span class="card-dest-info-txt">${p.drone || '—'}</span></div>
        <div class="card-dest-info" style="margin-top:4px">${SVG_SHIELD}<span class="card-dest-info-txt">Empresa verificada</span></div>
      </div>
    </div>`;
}

function cardEmpresaHtml(p) {
  const tags = p.culturas.slice(0, 3).map(c => `<span class="tag">${c}</span>`).join('');
  const maisTag = p.culturas.length > 3 ? `<span class="tag">+${p.culturas.length - 3}</span>` : '';

  return `
    <div class="card-empresa" onclick="abrirPerfil('${p.slug}')">
      <div class="avatar-sq">${avatarImg(p)}</div>
      <div class="empresa-info">
        <div class="empresa-top"><div class="empresa-nome">${p.nome}</div></div>
        <div class="empresa-loc">${LOC_ICON} ${p.cidade}</div>
        <div class="empresa-mid">
          <div class="empresa-rating">⭐ ${p.avaliacao} <span>(${p.avaliacoes}) · ${p.drone ? p.drone.split(' ')[1] || '' : ''}</span></div>
          <div class="status">
            <div class="status-dot" style="background:${p.disponivel ? '#16A34A' : '#D6D3D1'}"></div>
            <span class="status-txt" style="color:${p.disponivel ? '#16A34A' : '#A8A29E'}">${p.disponivel ? 'Disponível' : 'Indisponível'}</span>
          </div>
        </div>
        <div class="tags">${tags}${maisTag}</div>
      </div>
    </div>`;
}

function servicoCardHtml(s) {
  return `
    <div class="servico-card" data-servico="${s.id}" onclick="abrirModal('${s.id}')">
      <span class="nome">${s.nome}</span>
      <span class="badge"></span>
      <span class="seta">▼</span>
    </div>`;
}

// ════════════════════════════════════════════════════════
// GERAR A HOME
// ════════════════════════════════════════════════════════

function gerarHomeHtml(empresas) {
  const destaques = empresas.filter(p => p.destaque && p.disponivel);
  const destaquesHtml = destaques.map(cardDestaqueHtml).join('');
  const listaHtml = empresas.map(cardEmpresaHtml).join('');
  const servicosHtml = SERVICOS.map(servicoCardHtml).join('');

  let template = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.template.html'), 'utf-8');

  return preencherTemplate(template, {
    TITLE: 'SafraVoo — Pulverização Agrícola com Drone, Mapeamento e Monitoramento de Lavoura',
    META_DESCRIPTION: 'Encontre empresas verificadas de pulverização agrícola com drone, mapeamento e monitoramento de lavoura em todo o Brasil. Compare avaliações e solicite orçamento gratuito no SafraVoo.',
    DESTAQUES_HTML: destaquesHtml,
    LISTA_HTML: listaHtml,
    SERVICOS_HTML: servicosHtml,
    COUNT_TXT: `${empresas.length} empresas`
  });
}

// ════════════════════════════════════════════════════════
// GERAR CADA PERFIL DE EMPRESA
// ════════════════════════════════════════════════════════

function gerarPerfilHtml(p) {
  let template = fs.readFileSync(path.join(TEMPLATES_DIR, 'perfil.template.html'), 'utf-8');

  const localizacao = p.cidade + (p.estado ? `, ${p.estado}` : '');
  const title = `${p.nome} — Pulverização Agrícola em ${localizacao} | SafraVoo`;
  const description = `${p.nome} presta serviços de pulverização agrícola com drone em ${localizacao}. Avaliação ${p.avaliacao || '—'}, equipamento ${p.drone || 'drone agrícola'}. Solicite um orçamento pelo SafraVoo.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.nome,
    areaServed: localizacao,
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.cidade,
      addressRegion: p.estado
    },
    ...(p.avaliacao
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.avaliacao,
            reviewCount: p.avaliacoes || 1
          }
        }
      : {})
  };

  const culturasHtml = p.culturas.length
    ? p.culturas
        .map(
          c =>
            `<span class="cult-tag" style="background:#16A34A18;color:#16A34A;display:inline-block;margin:4px 6px 4px 0;padding:5px 14px;border-radius:50px;font-size:12px;font-weight:600;">${c}</span>`
        )
        .join(' ')
    : '<span style="color:#A8A29E;font-size:13px;">Nenhuma cultura cadastrada</span>';

  const botoesHtml = !p.disponivel
    ? '<div class="btn-unico">Indisponível no momento</div>'
    : `<div class="cta-btns">${
        p.orcamento ? `<a href="${p.orcamento}" target="_blank" rel="noopener" class="btn-orc">${SVG_ORC}Solicitar orçamento</a>` : ''
      }${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp}" target="_blank" rel="noopener" class="btn-wpp">${SVG_WPP}WhatsApp</a>` : ''}</div>`;

  return preencherTemplate(template, {
    TITLE: title,
    META_DESCRIPTION: description,
    SCHEMA_JSON: JSON.stringify(schema),
    NOME: p.nome,
    CIDADE: p.cidade,
    FOTO_HTML: avatarImg(p),
    DISP_BG: p.disponivel ? '#DCFCE7' : '#FEE2E2',
    DISP_DOT: p.disponivel ? '#16A34A' : '#DC2626',
    DISP_COLOR: p.disponivel ? '#16A34A' : '#DC2626',
    DISP_TXT: p.disponivel ? 'Disponível agora' : 'Indisponível',
    LINK_PERFIL_HTML: p.link_perfil ? `<a class="ver-perfil-btn" href="${p.link_perfil}" target="_blank" rel="noopener">${SVG_VER_PERFIL}Ver perfil completo ›</a>` : '',
    AVALIACAO: p.avaliacao || '—',
    ESTRELAS_HTML: gerarEstrelas(p.avaliacao),
    SERVICOS_REALIZADOS: p.servicos || 0,
    EXPERIENCIA: p.experiencia ? `${p.experiencia} anos` : '—',
    BIO: p.bio || 'Empresa especializada em serviços agrícolas com drones.',
    DRONE: p.drone || '—',
    AREA_MAX: `${p.area_max || '—'} ha`,
    CULTURAS_HTML: culturasHtml,
    BOTOES_HTML: botoesHtml,
    SLUG: p.slug
  });
}

// ════════════════════════════════════════════════════════
// COPIAR ARQUIVOS ESTÁTICOS PARA /dist
// ════════════════════════════════════════════════════════

function copiarArquivosEstaticos() {
  const arquivos = ['style.css', 'script.js', 'layout.png', 'banner-produtor.png', 'robots.txt', '_redirects'];

  arquivos.forEach(nome => {
    const origem = path.join(ROOT_DIR, nome);
    if (fs.existsSync(origem)) {
      fs.copyFileSync(origem, path.join(DIST_DIR, nome));
    } else {
      console.warn(`⚠️  Aviso: arquivo "${nome}" não encontrado na raiz, pulando.`);
    }
  });
}

// ════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ════════════════════════════════════════════════════════

async function build() {
  console.log('🚀 Iniciando build...');

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    throw new Error('Variáveis AIRTABLE_TOKEN / AIRTABLE_BASE não estão disponíveis no ambiente de build.');
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const empresas = await buscarEmpresas();
  console.log(`✅ ${empresas.length} empresas carregadas do Airtable`);

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), gerarHomeHtml(empresas));
  console.log('✅ index.html gerado');

  empresas.forEach(p => {
    const pastaEmpresa = path.join(DIST_DIR, 'empresa', p.slug);
    fs.mkdirSync(pastaEmpresa, { recursive: true });
    fs.writeFileSync(path.join(pastaEmpresa, 'index.html'), gerarPerfilHtml(p));
  });
  console.log(`✅ ${empresas.length} páginas de perfil geradas`);

  copiarArquivosEstaticos();
  console.log('✅ Arquivos estáticos copiados');

  console.log('🎉 Build concluído com sucesso!');
}

build().catch(erro => {
  console.error('❌ Erro no build:', erro);
  process.exit(1);
});

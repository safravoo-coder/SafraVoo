// ════════════════════════════════════════════════════════
// FUNCTION: empresas
// Roda no servidor do Netlify, não no navegador do visitante.
// Esconde o token do Airtable e devolve só os dados necessários,
// já filtrados e paginados (8 por vez).
// ════════════════════════════════════════════════════════

// Token e Base ID ficam aqui, NUNCA no HTML.
// Serão configurados como variáveis de ambiente no painel do Netlify
// (Site settings > Environment variables), não escritos direto no código.
const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE  = process.env.AIRTABLE_BASE;
const AT_TABLE = "Empresas";
const POR_PAGINA = 8;

exports.handler = async function (event) {
  if (!AT_TOKEN || !AT_BASE) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erro: "Configuração do serviço indisponível" })
    };
  }

  try {
    const params      = event.queryStringParameters || {};
    const cultura      = params.cultura || "Todas";
    const apenasDisp   = params.disponivel === "true";
    const busca        = (params.busca || "").toLowerCase();
    const pagina        = parseInt(params.pagina || "1", 10);
    const somenteDestaques = params.destaques === "true";

    // Busca TODAS as empresas do Airtable (a function faz isso,
    // não o navegador do visitante — só essa chamada usa o token).
    let registros = [];
    let offset    = "";
    do {
      const url = "https://api.airtable.com/v0/" + AT_BASE + "/" + encodeURIComponent(AT_TABLE)
        + "?pageSize=100" + (offset ? "&offset=" + offset : "");
      const res  = await fetch(url, { headers: { Authorization: "Bearer " + AT_TOKEN } });
      if (!res.ok) throw new Error("Erro Airtable " + res.status);
      const json = await res.json();
      registros  = registros.concat(json.records);
      offset     = json.offset || "";
    } while (offset);

    // Mapeia para o formato que o site usa
    let empresas = registros.map(r => {
      const f = r.fields;
      return {
        id:                r.id,
        nome:              f.nome              || "",
        foto:              f.foto              || "",
        cidade:            f.cidade            || "",
        avaliacao:         f.avaliacao         || 0,
        avaliacoes:        f.avaliacoes        || 0,
        preco:             f.preco             || 0,
        drone:             f.drone             || "",
        area_max:          f.area_max          || 0,
        culturas:          Array.isArray(f.cultura) ? f.cultura : [],
        disponivel:        !!f.disponivel,
        destaque:          !!f.destaque,
        servicos:          f.servicos          || 0,
        whatsapp:          f.whatsapp          || "",
        bio:               f.bio               || "",
        avaliacoes_texto:  f.avaliacoes_texto  || "",
        orcamento:         f.orcamento         || "",
        link_perfil:       f.link_perfil       || "",
        experiencia:       f.experiencia       || 0,
      };
    });

    // Modo "destaques": devolve todas as empresas marcadas como destaque
    // e disponíveis, sem paginação (a seção de destaques é fixa, não rola).
    if (somenteDestaques) {
      const destaques = empresas.filter(p => p.destaque && p.disponivel);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresas: destaques, total: destaques.length, pagina: 1, temMais: false })
      };
    }

    // Filtros (a mesma lógica que antes rodava no navegador)
    empresas = empresas.filter(p => {
      const okCultura = cultura === "Todas" || p.culturas.includes(cultura);
      const okBusca   = p.nome.toLowerCase().includes(busca) || p.cidade.toLowerCase().includes(busca);
      const okDisp    = !apenasDisp || p.disponivel;
      return okCultura && okBusca && okDisp;
    });

    const total       = empresas.length;
    const inicio      = (pagina - 1) * POR_PAGINA;
    const empresasPag = empresas.slice(inicio, inicio + POR_PAGINA);
    const temMais      = inicio + POR_PAGINA < total;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresas: empresasPag,
        total:    total,
        pagina:   pagina,
        temMais:  temMais
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erro: "Erro ao buscar empresas: " + err.message })
    };
  }
};

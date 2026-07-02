const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE  = process.env.AIRTABLE_BASE;
const AT_TABLE = "Empresas";

exports.handler = async function (event) {
  try {
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

    const empresas = registros.map(r => {
      const f = r.fields;
      return {
        id:               r.id,
        nome:             f.nome              || "",
        foto:             f.foto              || "",
        cidade:           f.cidade            || "",
        avaliacao:        f.avaliacao         || 0,
        avaliacoes:       f.avaliacoes        || 0,
        preco:            f.preco             || 0,
        drone:            f.drone             || "",
        area_max:         f.area_max          || 0,
        culturas:         Array.isArray(f.cultura) ? f.cultura : [],
        disponivel:       !!f.disponivel,
        destaque:         !!f.destaque,
        servicos:         f.servicos          || 0,
        whatsapp:         f.whatsapp          || "",
        bio:              f.bio               || "",
        avaliacoes_texto: f.avaliacoes_texto  || "",
        orcamento:        f.orcamento         || "",
        link_perfil:      f.link_perfil       || "",
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresas: empresas, total: empresas.length })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erro: "Erro ao buscar empresas: " + err.message })
    };
  }
};

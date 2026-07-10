const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE  = "app4M5Gxhhk8rst29";
const TABELA_EMPRESAS = "Empresas";
const TABELA_LEADS    = "tbl7TFz6wVyGOSxNo";

const HEADERS = {
  "Authorization": "Bearer " + AT_TOKEN,
  "Content-Type":  "application/json"
};

exports.handler = async function(event) {

  // ── GET: busca dados da empresa pelo slug ──────────────────────────────
  if (event.httpMethod === "GET") {
    const slug = (event.queryStringParameters || {}).slug || "";

    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ erro: "Slug ausente" }) };
    }

    try {
      const formula = encodeURIComponent(`{slug}="${slug}"`);
      const url = `https://api.airtable.com/v0/${AT_BASE}/${TABELA_EMPRESAS}?filterByFormula=${formula}&maxRecords=1`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error("Erro Airtable " + res.status);

      const json = await res.json();
      const r = json.records && json.records[0];

      if (!r) {
        return { statusCode: 404, body: JSON.stringify({ erro: "Empresa não encontrada" }) };
      }

      const f = r.fields;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: {
            nome:          f.nome          || "",
            foto:          f.foto          || "",
            cidade:        f.cidade        || "",
            whatsapp:      f.whatsapp      || "",
            email_destino: f.email_destino || "",
            culturas:      Array.isArray(f.cultura) ? f.cultura : [],
          }
        })
      };

    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ erro: err.message }) };
    }
  }

  // ── POST: grava lead no Airtable ───────────────────────────────────────
  if (event.httpMethod === "POST") {
    try {
      const lead = JSON.parse(event.body || "{}");

      const campos = {
        slug_empresa:         lead.slug_empresa        || "",
        nome:                 lead.nome                || "",
        email:                lead.email               || "",
        telefone:             lead.telefone            || "",
        telefone_whatsapp:    !!lead.telefone_whatsapp,
        regiao:               lead.regiao              || "",
        servicos_solicitados: lead.servicos_solicitados|| "",
        area_ha:              Number(lead.area_ha)     || 0,
        data_desejada:        lead.data_desejada       || "",
        observacoes:          lead.observacoes         || "",
      };

      const url = `https://api.airtable.com/v0/${AT_BASE}/${TABELA_LEADS}`;
      const res = await fetch(url, {
        method:  "POST",
        headers: HEADERS,
        body:    JSON.stringify({ fields: campos, typecast: true })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error("Erro Airtable " + res.status + ": " + txt);
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true })
      };

    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ erro: err.message }) };
    }
  }

  return { statusCode: 405, body: "Método não permitido" };
};

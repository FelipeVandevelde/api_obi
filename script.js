import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CALENDAR_URL = "https://olimpiada.ic.unicamp.br/calendario/";
const OUTPUT_FILE = path.join(__dirname, "request.json");
const BACKGROUND_CLASSES = ["dark-green-bkgd", "light-blue-bkgd", "black-bkgd"];

async function fazerScraping() {
  const resposta = await fetch(CALENDAR_URL);
  const html = await resposta.text();
  const $ = cheerio.load(html);

  const ano = extrairAno($);
  const eventos = extrairEventosPorMes($);

  return { ano, eventos };
}

function extrairAno($) {
  const textoTitulo = $("h2").first().text();
  const matchAno = textoTitulo.match(/\b(\d{4})\b/);
  return matchAno ? matchAno[1] : "";
}

function extrairEventosPorMes($) {
  const meses = $("div.cal-month");
  const eventos = [];

  meses.each((indiceMes, mesElement) => {
    const grid = $(mesElement).children("div.cal-month-grid");
    let eventosDoMes = $();

    BACKGROUND_CLASSES.forEach((classe) => {
      eventosDoMes = eventosDoMes.add(grid.children(`div.cal-day.${classe}`));
    });

    if (!eventosDoMes.length) {
      return;
    }

    const mesNumero = String(indiceMes + 1).padStart(2, "0");

    eventosDoMes.each((_, eventoElement) => {
      const dia = $(eventoElement)
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim()
        .padStart(2, "0");

      const descricoesHtml = $(eventoElement).children("span").html() ?? "";
      const descricoes = descricoesHtml
        .split(/<br\s*\/?>/i)
        .map((texto) => texto.trim())
        .filter(Boolean);

      descricoes.forEach((descricao) => {
        eventos.push({
          dia,
          mes: mesNumero,
          descricao,
        });
      });
    });
  });

  return eventos;
}

const data = await fazerScraping();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");

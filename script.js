import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outFile = path.join(__dirname, "request.json");

async function fazerScraping() {
  const resposta = await fetch('https://olimpiada.ic.unicamp.br/calendario/');
  const html = await resposta.text();

  const $ = cheerio.load(html);

  let response = {};

  const ano = $('h2').first().text().trim().split(' ')[1];
  response.ano = ano;
  const meses = $('div.cal-month');

  for (let i = 0; i < meses.length; i++) {
    let eventos = $(meses[i]).children('div.cal-month-grid').children('div.cal-day.dark-green-bkgd');

    eventos = eventos.add($(meses[i]).children('div.cal-month-grid').children('div.cal-day.light-blue-bkgd')); // Adiciona eventos com fundo claro, se necessário
    
    eventos = eventos.add($(meses[i]).children('div.cal-month-grid').children('div.cal-day.black-bkgd')); // Adiciona eventos com fundo claro, se necessário

    if (eventos.length === 0) continue;
    let Auxresponse = [];
    for (let j = 0; j < eventos.length; j++) {
      let dia = $(eventos[j]).clone().children().remove().end().text().trim().padStart(2, '0');
      let mes = (i+1).toString().padStart(2, '0');

      let descricoes = $(eventos[j]).children('span').html().split(/<br\s*\/?>/i).map(texto => texto.trim());

      descricoes.forEach(descricao => {
        Auxresponse.push({
          dia: dia,
          mes: mes,
          descricao: descricao
        });
      });
    }
    response['eventos'] = response['eventos'] ? response['eventos'].concat(Auxresponse) : Auxresponse;
  }
  return response;
}
const data = await fazerScraping();

fs.writeFileSync(outFile, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Wrote ${outFile}`);

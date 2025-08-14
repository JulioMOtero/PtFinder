document.getElementById("formBuscaPersonagem").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nomeInput = document.getElementById("nomePersonagem").value.trim();

    const iconesVocacao = {
        "druid": "https://www.tibiawiki.com.br/images/b/be/Snakebite_Rod.gif",
        "elder druid": "https://www.tibiawiki.com.br/images/b/be/Snakebite_Rod.gif",
        "sorcerer": "https://www.tibiawiki.com.br/images/9/90/Wand_of_Vortex.gif",
        "master sorcerer": "https://www.tibiawiki.com.br/images/9/90/Wand_of_Vortex.gif",
        "knight": "https://www.tibiawiki.com.br/images/2/27/Longsword.gif",
        "elite knight": "https://www.tibiawiki.com.br/images/2/27/Longsword.gif",
        "paladin": "https://www.tibiawiki.com.br/images/1/12/Guardcatcher.gif",
        "royal paladin": "https://www.tibiawiki.com.br/images/1/12/Guardcatcher.gif",
        "monk": "https://www.tibiawiki.com.br/images/3/3d/Pair_of_Monk_Fists.gif",
        "exalted monk": "https://www.tibiawiki.com.br/images/3/3d/Pair_of_Monk_Fists.gif",
        "none": "https://static.tibia.com/images/characters/none.gif",
    };

    if (!nomeInput) return alert("Please enter a valid name.");

    let proxy = "https://corsproxy.io/?";
    let url = `${proxy}https://www.tibia.com/community/?name=${encodeURIComponent(nomeInput)}`;

    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const tabela = doc.querySelector("table.TableContent");
        if (!tabela) {
            document.getElementById("detalhesPersonagem").innerHTML = `<p style="color: red;">Character not found.</p>`;
            return;
        }

        const linhas = tabela.querySelectorAll("tr");
        const dados = [];

        linhas.forEach(tr => {
            const cols = tr.querySelectorAll("td, th");
            if (cols.length === 2) {
                const chave = cols[0].textContent.trim().replace(":", "");
                const valor = cols[1].textContent.trim();
                dados.push({ chave, valor });
            }
        });

        let nome = "", level = "", vocation = "", world = "";

        dados.forEach(item => {
            switch (item.chave) {
                case "Name":
                    nome = item.valor;
                    break;
                case "Level":
                    level = item.valor;
                    break;
                case "Vocation":
                    vocation = item.valor;
                    break;
                case "World":
                    world = item.valor;
                    break;
            }
        });

        const texto = `Character info:\nName: ${nome} | Level: ${level} | Vocation: ${vocation} | World: ${world}`;

        document.getElementById("detalhesPersonagem").innerHTML = `<pre>${texto}</pre>`;

        if (world) {
            const urlMundo = `${proxy}https://www.tibia.com/community/?subtopic=worlds&world=${encodeURIComponent(world)}`;
            try {
                const respMundo = await fetch(urlMundo);
                const htmlMundo = await respMundo.text();
                const docMundo = parser.parseFromString(htmlMundo, "text/html");

                const tabelaMundo = docMundo.querySelector("table.Table2");
                if (!tabelaMundo) {
                    throw new Error("Tabela de personagens online não encontrada.");
                }

                const linhasMundo = tabelaMundo.querySelectorAll("tr");
                const personagensOnline = [];

                linhasMundo.forEach((linha, i) => {
                    if (i < 2) return;
                    const texto = linha.textContent.trim();
                    const match = texto.match(/(\D*?)(\d+)(.*)/);
                    if (!match) return;

                    const nomePersonagem = match[1].trim();
                    const levelPersonagem = match[2];
                    const vocacaoPersonagem = match[3].trim();

                    personagensOnline.push({
                        Name: nomePersonagem,
                        Level: parseInt(levelPersonagem),
                        Vocation: vocacaoPersonagem //adicionar uma imagem ao lado de cada voc 
                    });
                });

                const levelInt = parseInt(level) || 0;
                const vocLower = (vocation || "").toLowerCase();
                const nivelMinimo = Math.floor(levelInt * (2 / 3));

                const personagensCompatíveis = personagensOnline.filter(item => {
                    const itemLevel = parseInt(item.Level) || 0;
                    return itemLevel >= nivelMinimo && itemLevel <= levelInt;
                });

                const mapaVocacoes = {
                    knight: ["knight", "elite knight"],
                    sorcerer: ["sorcerer", "master sorcerer"],
                    druid: ["druid", "elder druid"],
                    paladin: ["paladin", "royal paladin"],
                    monk: ["monk", "exalted monk"]
                };

                const divInformacoes = document.getElementById("informacoes");
                const divChecks = document.createElement("div");
                divChecks.style.marginTop = "10px";
                divChecks.innerHTML = `<strong>Vocation Filter:</strong><br>`;

                Object.keys(mapaVocacoes).forEach(voc => {
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = voc.toLowerCase(); // melhor deixar tudo lowercase para comparar depois
                    checkbox.id = `check-${voc}`;

                    const label = document.createElement("label");
                    label.htmlFor = checkbox.id;
                    label.style.marginRight = "15px";
                    label.style.display = "inline-flex";
                    label.style.alignItems = "center";
                    label.style.gap = "5px";
                    label.style.cursor = "pointer";

                    // Cria a imagem do ícone
                    const vocLower = voc.toLowerCase();
                    const imgIcon = document.createElement("img");
                    imgIcon.src = iconesVocacao[vocLower] || "";
                    imgIcon.alt = voc;
                    imgIcon.style.height = "20px";
                    imgIcon.style.width = "20px";
                    imgIcon.style.objectFit = "contain";
                    imgIcon.style.userSelect = "none";

                    label.appendChild(checkbox);
                    label.appendChild(imgIcon);
                    label.append(` ${voc.charAt(0).toUpperCase() + voc.slice(1)}`);

                    divChecks.appendChild(label);
                });


                divInformacoes.innerHTML = `
    <h2>Characters compatible with Shared XP in world ${world}</h2>
    ${criarTabela(personagensCompatíveis, level, vocation)}
`;
                divInformacoes.prepend(divChecks);

                divChecks.addEventListener("change", () => {
                    const selecionadas = Array.from(divChecks.querySelectorAll("input[type=checkbox]:checked"))
                        .map(cb => cb.value);


                    const filtrados = personagensCompatíveis.filter(p => {
                        const vocacaoPersonagem = normalizarTexto(p.Vocation || "");

                        if (selecionadas.length === 0) return true;

                        const bate = selecionadas.some(sel => {
                            const grupoRaw = mapaVocacoes[sel];
                            if (!grupoRaw) return false;

                            const grupo = grupoRaw.map(v => normalizarTexto(v));

                            return grupo.includes(vocacaoPersonagem);
                        });

                        return bate;
                    });


                    const novaTabela = criarTabela(filtrados, level, vocation);
                    divInformacoes.innerHTML = `
    <h2>Characters compatible with Shared XP in world ${world}</h2>
    ${novaTabela}
  `;
                    divInformacoes.prepend(divChecks);
                });




            } catch (erro) {
                document.getElementById("informacoes").innerHTML = `<p style="color: red;">Error fetching online characters in world ${world}: ${erro.message}</p>`;
            }
        }
    } catch (err) {
        document.getElementById("detalhesPersonagem").innerHTML = `<p style="color: red;">Error fetching character: ${err.message}</p>`;
    }

    function normalizarVocacao(texto) {
        return texto
            .replace(/\u00A0/g, " ") 
            .normalize("NFKD")       
            .replace(/[^\w\s]/g, "")  
            .replace(/\s+/g, " ")    
            .trim()
            .toLowerCase();
    }

    function normalizarTexto(texto) {
        return texto.replace(/\u00A0/g, " ").toLowerCase().trim();
    }

    function criarTabela(data, level, vocation) {
        if (!data || data.length === 0) return "<p>No characters found.</p>";

        const cabecalhos = Object.keys(data[0]);
        const cabecalhoHTML = cabecalhos.map(h => `<th>${h}</th>`).join("");




        const levelInt = parseInt(level) || 0;
        const vocLower = (vocation || "").toLowerCase();

        const nivelMinimo = Math.floor(levelInt * (2 / 3));

        const linhasHTML = data.map(item => {
            const itemLevel = parseInt(item.Level) || 0;
            const itemVoc = (item.Vocation || "").toLowerCase().trim();

            const podeSharedXP = itemLevel >= nivelMinimo && itemLevel <= levelInt;
            const mesmaVocacao = itemVoc === vocLower;

            let estilo = "";

            if (podeSharedXP && mesmaVocacao) {
                estilo = "style='background-color:#a5d6a7; font-weight:bold;'";
            } else if (podeSharedXP) {
                estilo = "style='background-color:#c8e6c9;'";
            } else if (mesmaVocacao) {
                estilo = "style='background-color:#fff9c4;'";
            }

            return `<tr ${estilo}>${cabecalhos.map(col => {
                let valor = item[col]; // valor padrão

                if (col === "Vocation") {
                    const vocRaw = normalizarVocacao(item[col]);
                    console.log(`Vocação formatada: "${vocRaw}"`);
                    const vocImg = iconesVocacao[vocRaw];
                    console.log(vocImg);
                    valor = vocImg
                        ? `<img src="${vocImg}" alt=" " style="height:30px; vertical-align:middle; margin-right:5px;" /> ${item[col]}`
                        : item[col];
                }

                return `<td>${valor}</td>`;
            }).join("")}</tr>`;
        }).join("");

        return `
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-top: 20px; width: 100%;">
  <thead><tr>${cabecalhoHTML}</tr></thead>
  <tbody>${linhasHTML}</tbody>
</table>`;
    }


});


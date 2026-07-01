# Atlas Fotográfico de Portugal

Site pessoal para planear saídas fotográficas em Portugal Continental, Açores e Madeira: locais organizados por distrito/concelho, categorias, melhores horas para fotografar, objetivas recomendadas e uma checklist de locais visitados.

Feito em HTML, CSS e JavaScript puro — sem frameworks, sem build step. A única dependência externa é o [Leaflet](https://leafletjs.com) (mapa interativo), vendorizado localmente em `vendor/leaflet/`. Os dados vivem em `data/locations.json` e o teu progresso pessoal (visitados, favoritos, ratings, notas) fica guardado no `localStorage` do navegador.

## Estrutura de ficheiros

```
.
├── index.html          # Página inicial — dashboard de progresso e sugestões
├── mapa.html            # Mapa geográfico real (Leaflet + OpenStreetMap)
├── explorar.html         # Lista/tabela filtrável com todos os locais
├── local.html            # Página-modelo de um local (?id=...)
├── pessoal.html          # Área pessoal — visitados, favoritos, exportar/importar/limpar
├── core.js               # Lógica partilhada por todas as páginas (dados, filtros, localStorage)
├── dashboard.js           # Lógica específica da página inicial
├── mapa.js               # Lógica específica do mapa
├── explorar.js            # Lógica específica do Explorar
├── local.js               # Lógica específica da página de local
├── pessoal.js             # Lógica específica da Área pessoal
├── styles.css            # Design (claro/escuro, responsivo, impressão)
├── data/
│   └── locations.json    # Base de dados dos locais (edita este ficheiro para adicionar/alterar locais)
├── vendor/
│   └── leaflet/           # Biblioteca Leaflet vendorizada (JS, CSS, ícones)
└── README.md
```

Cada página HTML inclui sempre `core.js` (funções partilhadas) e depois o seu próprio ficheiro `<página>.js` com a lógica específica. Não há nenhum bundler nem passo de build — é só abrir os ficheiros num navegador (ou servidor local, ver abaixo).

## Como abrir localmente

As páginas carregam `data/locations.json` com `fetch()`. Por segurança (política de CORS), o **Chrome** e o **Safari** bloqueiam este pedido quando o ficheiro é aberto diretamente com duplo-clique (protocolo `file://`). O **Firefox** costuma permitir. Para garantir que tudo funciona em qualquer navegador (incluindo o mapa), a forma mais simples é correr um mini servidor local — não precisas de instalar nada, o Python já vem no macOS:

```bash
cd "Atlas Fotográgico"
python3 -m http.server 8080
```

Depois abre **http://localhost:8080** no navegador. Para parar o servidor, `Ctrl+C` no terminal.

Alternativas:
- Abrir `index.html` diretamente com duplo-clique **no Firefox** (costuma funcionar sem servidor, exceto o mapa — ver nota abaixo).
- Usar a extensão "Live Server" do VS Code.
- `npx serve .` se tiveres Node.js instalado.

Se abrires o ficheiro e vires uma mensagem a dizer que os locais não carregaram, é exatamente este bloqueio de CORS — usa uma das opções acima.

**Nota sobre o Mapa:** mesmo com o servidor local, a página `mapa.html` (e o mini-mapa em `local.html`) precisam de internet para carregar as imagens do mapa (tiles do OpenStreetMap). A biblioteca Leaflet em si está vendorizada e funciona offline — só as imagens do mapa exigem ligação à internet, tal como aconteceria com o Google Maps.

## Páginas

- **Início (`index.html`)** — dashboard com total de locais, visitados, progresso, favoritos, contagens por distrito/categoria, e sugestões: local aleatório, locais ideais para a estação/hora atuais, e os teus favoritos.
- **Mapa (`mapa.html`)** — mapa real (Leaflet + OpenStreetMap) com um marcador por local, cor diferente consoante o estado (por visitar / visitado / favorito), popup com resumo e link para a ficha completa, os mesmos filtros do Explorar, e atalhos para saltar entre Continente / Açores / Madeira.
- **Explorar (`explorar.html`)** — lista filtrável e pesquisável de todos os locais, com ordenação (nome, rating, distrito, categoria, interesse fotográfico, não visitados primeiro) e impressão da lista filtrada.
- **Local (`local.html?id=...`)** — ficha completa de um local: toda a informação, sugestões de composição, objetivas recomendadas, mini-mapa da localização exata, link para o Google Maps, e os controlos pessoais (visitado, favorito, rating, notas).
- **Área pessoal (`pessoal.html`)** — progresso pessoal, lista de visitados e de favoritos, e as ações de exportar/importar/limpar o progresso guardado.

## Filtros disponíveis (Explorar e Mapa)

Distrito/região, concelho (dependente do distrito escolhido), categoria, melhor hora, melhor estação, objetiva principal, entrada, dificuldade, interesse fotográfico mínimo, visitado/não visitado e favoritos.

## Como editar ou adicionar locais

Todos os locais estão em `data/locations.json`, um array de objetos. Cada local segue esta estrutura:

```json
{
  "id": "lis-011",
  "nome": "Nome do local",
  "distrito": "Lisboa",
  "concelho": "Sintra",
  "freguesia": "Colares",
  "categoria": "Miradouro",
  "subcategoria": "Descrição curta da subcategoria",
  "coordenadas": { "lat": 38.7811, "lng": -9.4986 },
  "googleMapsUrl": "https://www.google.com/maps?q=38.7811,-9.4986",
  "melhorEstacao": "Todo o ano",
  "melhorHora": "Golden hour",
  "interesseFotografico": 5,
  "dificuldade": "Fácil",
  "entrada": "Gratuita",
  "estacionamento": "Fácil",
  "tempoMedioVisita": "1 hora",
  "objetivaPrincipal": "Canon EF-S 10-22mm f/3.5-4.5 USM (via adaptador EF-RF)",
  "objetivaSecundaria": "Canon RF-S 18-45mm f/4.5-6.3",
  "oQueFotografar": "O que vale a pena fotografar neste local",
  "notasFotograficas": "Dicas práticas: melhor ângulo, cuidados, luz, etc."
}
```

Notas importantes:
- `id` tem de ser único em todo o ficheiro (usa-se também no URL `local.html?id=...` e não deve mudar depois de definido).
- `freguesia` pode ser `null` se não se aplicar.
- `categoria` deve ser uma das: Jardim, Miradouro, Paisagem, Costa, Praia, Floresta, Cascata, Rio, Lagoa, Arquitetura histórica, Arquitetura moderna, Street photography, Fauna, Observação de aves, Fotografia noturna, Aldeia, Palácio, Castelo, Ruínas. (Se adicionares uma categoria nova, adiciona também um emoji em `CATEGORY_ICONS` no `core.js`.)
- `melhorHora` deve ser uma das: Amanhecer, Manhã, Meio do dia, Tarde, Golden hour, Hora azul, Noite.
- `melhorEstacao` pode ser Primavera, Verão, Outono, Inverno ou "Todo o ano".
- Não é preciso guardar `visitado`, `favorito`, `rating` ou `notas pessoais` neste ficheiro — isso é estado pessoal e vive só no `localStorage` do teu navegador (secção seguinte).

Depois de editar o JSON, basta recarregar a página (com o servidor local a correr) para ver as alterações — em qualquer uma das páginas (todas leem o mesmo ficheiro).

### Sobre o crescimento da base de dados

A base atual tem 90 locais reais, com coordenadas e descrições cuidadas. Se quiseres expandir para 50-100 locais por distrito (Portugal Continental tem 18 distritos, mais Açores e Madeira), o mais seguro é fazê-lo progressivamente, distrito a distrito, confirmando nome, coordenadas GPS e dados práticos de cada local novo antes de o adicionares — para distritos menos documentados, vale a pena cruzar fontes (câmara municipal, guias de fotografia, OpenStreetMap) em vez de confiar só na memória de quem escreve os dados.

## Onde fica o meu progresso pessoal

O progresso (visitados, favoritos, ratings, notas) é guardado no `localStorage` do navegador sob a chave `atlasFotografico.state.v1`, como um objeto indexado pelo `id` de cada local:

```json
{
  "lis-001": { "visited": true, "favorite": false, "rating": 4, "notes": "Fui de manhã, luz ótima." }
}
```

Usa o botão **⬇️ Exportar progresso** (na Área pessoal) regularmente para fazeres backup deste estado, e **⬆️ Importar progresso** para o restaurar. O botão **🗑️ Limpar progresso** apaga tudo — pede confirmação antes de o fazer.

## Equipamento fotográfico usado nas recomendações

- Canon EOS R50
- Canon RF-S 18-45mm
- Canon RF-S 55-210mm
- Canon EF 50mm f/1.8 (com adaptador EF-RF)
- Canon EF-S 10-22mm f/3.5-4.5 USM (com adaptador EF-RF)

Todas as sugestões de "objetiva principal" e "objetiva secundária" nos dados referem-se sempre a este equipamento.

## Publicar online

O site é 100% estático, por isso qualquer um destes serviços funciona sem configuração extra:

### GitHub Pages

1. Cria um repositório no GitHub e faz push destes ficheiros (incluindo a pasta `vendor/`) para o branch `main`.
2. Vai a **Settings → Pages**.
3. Em "Source", escolhe o branch `main` e a pasta `/ (root)`.
4. Guarda. Ao fim de um ou dois minutos o site fica disponível em `https://<o-teu-utilizador>.github.io/<nome-do-repositorio>/`.

### Netlify

1. Arrasta a pasta do projeto para [app.netlify.com/drop](https://app.netlify.com/drop), ou
2. Liga o repositório do GitHub em "Add new site → Import an existing project". Não é preciso build command nem publish directory além da raiz (`.`).

### Vercel

1. Importa o repositório em [vercel.com/new](https://vercel.com/new).
2. Framework preset: "Other". Sem build command necessário — é um site estático.

Em qualquer um destes serviços (protocolo `https://`), o `fetch()` ao `data/locations.json` funciona sem qualquer problema de CORS, mesmo no Chrome e no Safari — o aviso da secção "Como abrir localmente" aplica-se apenas a abrir o ficheiro diretamente do disco. O mapa continua a precisar de internet para as imagens (tiles), como em qualquer site publicado.

## Possíveis próximos passos

- Expandir `data/locations.json` distrito a distrito (ver nota acima).
- Se a base crescer muito (centenas/milhares de locais), considerar o plugin [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) para agrupar marcadores próximos no mapa — não incluído agora porque 90 locais não precisam disso.

## Requisitos técnicos

- Sem build step, sem `package.json`.
- Uma única dependência externa: Leaflet (vendorizada em `vendor/leaflet/`, sem CDN).
- Compatível com qualquer navegador moderno (Chrome, Firefox, Safari, Edge).
- Otimizado para telemóvel: menu de navegação e filtros colapsam em ecrãs pequenos, cartões em coluna única.
- `localStorage` funciona sem qualquer servidor — o progresso é guardado assim que abres a página, mesmo offline (à exceção das imagens do mapa, que precisam de internet).

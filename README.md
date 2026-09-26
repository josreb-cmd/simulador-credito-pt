# Simulador de Crédito PT

Simulador de **crédito à habitação** e **crédito pessoal** alinhado com o regime fiscal português e a Recomendação Macroprudencial n.º 1/2026 do Banco de Portugal.

Versão publicada: https://nhrzgoa8.monkeycode-ai.gallery/

## O que calcula

### Crédito à habitação
- Prestação (sistema francês), juros, MTIC e TAEG
- IMT e Imposto do Selo (aquisição 0,8% e crédito hipotecário 0,6%)
- LTV: 90% em HPP / obras; 80% noutras finalidades
- DSTI: máximo 45%, com teste de esforço de taxa (out. 2023)
- Prazos: até 40 anos se o mutuário mais velho tem 35 anos ou menos; até 35 anos se tem mais de 35
- Crédito jovem (isenção IMT/IS e garantia pública LTV 100%): só se **todos** os mutuários tiverem 35 anos ou menos

### Crédito pessoal
- Prestação, Imposto do Selo, TAEG vs. teto indicativo de usura (DL 133/2009)
- DSTI 45% e prazo até 10 anos

A ferramenta é informativa. Não substitui a FIN/FINE nem a análise do banco.

## Requisitos

- Node.js 18 ou superior
- npm

## Como correr

```bash
npm install
npm run dev
```

Abre o endereço indicado no terminal (por omissão `http://localhost:8000`).

## Outros comandos

```bash
# Testes do motor de cálculo
node src/calc.test.js

# Build de produção
npm run build

# Pré-visualizar o build
npm run preview
```

## Estrutura

```text
index.html
package.json
package-lock.json
vite.config.js
src/
  calc.js
  calc.test.js
  main.js
  rules.js
  styles.css
```

## Publicar no GitHub

Envia apenas os ficheiros acima (e este README). Não envies `node_modules/`, `dist/` nem ficheiros `.zip`.

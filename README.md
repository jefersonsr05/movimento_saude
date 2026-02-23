# Movimento Saúde - Controle de Assinaturas (Academia)

Sistema web para controle de assinaturas e mensalidades de academia: cadastro de clientes, planos, mensalidades, formas de pagamento e movimento de caixa, com relatórios e dashboard.

## Tecnologias

- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite
- **Frontend:** React (Vite), TypeScript, React Router, React Query
- **Execução:** Docker Compose (um único comando para subir tudo)

## Rodando com Docker (recomendado – Windows/local)

No **Windows** (ou em qualquer máquina com Docker instalado):

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e inicie-o.
2. Abra o terminal na pasta do projeto e execute:

```bash
docker compose up --build
```

3. Acesse no navegador:
   - **Sistema:** http://localhost:3000
   - **API:** http://localhost:3001

Os dados ficam persistidos em um volume do Docker (`backend-data`). Para parar: `Ctrl+C` e depois `docker compose down`.

## Rodando sem Docker (desenvolvimento)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

O backend sobe em http://localhost:3001. O arquivo do banco SQLite fica em `backend/data/sqlite.db`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em http://localhost:3000 e usa o proxy do Vite para a API em 3001.

Para **build de produção** do frontend (ex.: para servir junto ao Docker), use `npm run build`. A URL da API em produção pode ser configurada com a variável de ambiente `VITE_API_URL` (ex.: `http://localhost:3001`) no momento do build.

## Funcionalidades

- **Dashboard:** totalizadores de clientes ativos por tipo de plano
- **Planos:** CRUD de planos (descrição, valor, treinos/semana, tipo de assinatura: Mensal, Trimestral, Semestral, Anual)
- **Formas de pagamento:** CRUD (Dinheiro, Cartão Crédito/Débito, PIX, Transferência)
- **Clientes:** CRUD com dados básicos e ficha de saúde; opção “Contratar plano” (gera a primeira mensalidade)
- **Mensalidades:** listagem por período/situação; registrar pagamento (atualiza situação e lança entrada no caixa)
- **Movimento de caixa:** lançamentos manuais de entradas e saídas; vínculo opcional com mensalidade
- **Relatórios:** previsão de caixa (realizados x a realizar) e recebimentos (entradas, saídas e saldo no período)

A geração automática das **próximas mensalidades** (5 dias antes do vencimento) roda em job diário no backend (cron 6h).

## Observações

- **CPF:** armazenado sem formatação; no frontend há máscara opcional.
- **Idade:** calculada a partir da data de nascimento no backend.
- Em ambiente Docker, o frontend é servido em produção (build estático) e a API em outra porta; use `VITE_API_URL=http://localhost:3001` no build se o acesso for pelo mesmo host.

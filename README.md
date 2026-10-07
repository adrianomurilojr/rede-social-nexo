<img width="1917" height="912" alt="Captura de tela 2026-10-07 064601" src="https://github.com/user-attachments/assets/7821a6d0-56d3-4f08-9836-3f106a38c293" />


# Nexo

Rede social minimalista com frontend e backend.

## Requisitos

- Node.js 20 ou superior
- npm

## Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

A API ficará disponível em `http://localhost:3333`. O banco SQLite é criado em `backend/prisma/dev.db`.

## Frontend

Em outro terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Funcionalidades

- Cadastro e login com senha armazenada com hash e token JWT.
- Feed de publicações com autor e curtidas.
- Criação de publicações e alternância de curtidas.
- Layout responsivo em azul, preto e ouro.
- Telas separadas de cadastro (`/register`) e login (`/login`); após autenticar, a pessoa segue para o mural (`/`).

O frontend usa `NEXT_PUBLIC_API_URL` para localizar a API. O backend usa `DATABASE_URL`, `JWT_SECRET` e `PORT`; configure um segredo JWT forte antes de publicar.

# Deploy no Render.com

## 1. Backend
- Crie um serviço **Web Service** (Node.js)
- Build command: `cd backend && npm install && npm run build`
- Start command: `cd backend && npm start`
- Variáveis de ambiente:
  - `PORT=3001`
  - `DB_PATH=/data`
- Disco persistente:
  - Nome: `data`, Caminho de montagem: `/data`, Tamanho: 1GB

## 2. Frontend
- Crie um serviço **Static Site**
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Variável de ambiente:
  - `VITE_API_URL=https://production-guard-backend-<sufixo>.onrender.com/api`

## 3. render.yaml (opcional)
- Faça deploy automático conectando o repositório e usando o arquivo `render.yaml` já presente no projeto.

## Observações
- O backend já está preparado para usar SQLite em `/data` (persistente).
- O frontend precisa apontar para a URL pública do backend.
- Não esqueça de ajustar `<sufixo>` para o nome real do serviço backend criado no Render.

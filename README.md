# Deploy no Render.com

1. Crie dois serviços no Render:
	- **Backend**: Web Service, Node, build: `cd backend && npm install && npm run build`, start: `cd backend && npm start`, disco persistente `/data`.
	- **Frontend**: Static Site, build: `npm install && npm run build`, publish: `dist`.
2. Configure a variável de ambiente `VITE_API_URL` no frontend para a URL pública do backend, por exemplo:
	`https://production-guard-backend-<nome-do-seu-backend>.onrender.com/api`
	(Use o nome real do serviço backend criado no Render.)
3. Teste se o backend está online acessando `/api/health` na URL pública do backend.
3. O backend já está preparado para usar SQLite em `/data` (persistente).
4. Use o arquivo `render.yaml` para deploy automático (opcional).

# Welcome to your Lovable project

TODO: Document your project here

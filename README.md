# Deploy no Render.com


## Deploy Cloud (Vercel + Render + Supabase)

1. **Supabase (Banco PostgreSQL)**
	- Crie um projeto no [Supabase](https://supabase.com/).
	- Copie a string de conexão PostgreSQL (`DATABASE_URL`).

2. **Backend (Render)**
	- Crie um serviço Web Service (Node) no [Render](https://render.com/).
	- Build command: `cd backend && npm install && npm run build`
	- Start command: `cd backend && npm start`
	- Adicione a variável de ambiente `DATABASE_URL` com o valor do Supabase.
	- (Opcional: remova disco persistente, não é mais necessário.)

3. **Frontend (Vercel ou Render)**
	- Deploy da pasta raiz no [Vercel](https://vercel.com/) (ou Static Site no Render).
	- Configure a variável de ambiente `VITE_API_URL` para a URL pública do backend Render, exemplo:
	  `https://production-guard-backend-<nome>.onrender.com/api`

4. **Testes**
	- Acesse `/api/health` na URL do backend Render para validar.
	- Acesse o frontend normalmente.

5. **Deploy Automático**
	- O arquivo `render.yaml` já está pronto para deploy automático no Render.

---

**Importante:**
- O backend agora usa apenas PostgreSQL (Supabase) via variável `DATABASE_URL`.
- Não há mais dependência de SQLite ou disco local.
- O frontend lê a URL do backend via `VITE_API_URL`.



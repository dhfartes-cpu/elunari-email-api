// api/gerar-licenca.js

// (Opcional) Banco temporário em memória ou lista centralizada de licenças ativas
// Em produção com Vercel, o ideal é salvar em um arquivo JSON na nuvem ou usar a lógica de chave mestra.
let LICENCAS_WEB = {
    // Exemplo pré-cadastrado: "email_da_escola@rs.gov.br": "WEB-CHAVE-1234"
    "escola.teste@rs.gov.br": { chave: "ELUNARI-WEB-2026-TESTE", validade: "2027-11-15" }
};

module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Se você acessar via GET no navegador, ele mostra um mini painel HTML simples para gerar a chave
    if (req.method === 'GET') {
        const htmlPainel = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Elunari Tech - Gerador de Licenças Web</title>
                <style>
                    body { font-family: sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 30px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                    input, select, button { width: 100%; padding: 10px; margin-top: 10px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; }
                    button { background: #0d9488; font-weight: bold; cursor: pointer; border: none; }
                    button:hover { background: #14b8a6; }
                    .resultado { margin-top: 15px; background: #334155; padding: 10px; border-radius: 6px; word-break: break-all; font-family: monospace; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Gerador Web - Elunari Tech</h2>
                    <form onsubmit="gerarChave(event)">
                        <label>Senha Admin:</label>
                        <input type="password" id="adminSenha" placeholder="Sua senha secreta" required>
                        <label>E-mail da Escola:</label>
                        <input type="email" id="emailEscola" placeholder="escola@rs.gov.br" required>
                        <label>Validade:</label>
                        <select id="diasValidade">
                            <option value="365">1 Ano (365 dias)</option>
                            <option value="730">2 Anos (730 dias)</option>
                        </select>
                        <button type="submit">Gerar Chave de Licença</button>
                    </form>
                    <div class="resultado" id="txtResultado" style="display:none;"></div>
                </div>
                <script>
                    async function gerarChave(e) {
                        e.preventDefault();
                        const senha = document.getElementById('adminSenha').value;
                        const email = document.getElementById('emailEscola').value;
                        const dias = document.getElementById('diasValidade').value;

                        const res = await fetch('/api/gerar-licenca', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ senha, email, dias })
                        });
                        const dados = await res.json();
                        const div = document.getElementById('txtResultado');
                        div.style.display = 'block';
                        if(res.ok) {
                            div.innerHTML = '<b>Chave Gerada com Sucesso:</b><br><span style="color:#38bdf8; font-size:1.1rem;">' + dados.chave + '</span>';
                        } else {
                            div.innerHTML = '<span style="color:#f87171;">Erro: ' + (dados.error || 'Senha incorreta') + '</span>';
                        }
                    }
                </script>
            </body>
            </html>
        `;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(htmlPainel);
    }

    // Se for POST, processa a criação da chave
    if (req.method === 'POST') {
        const { senha, email, dias } = req.body;

        // Defina aqui a sua senha mestre secreta para acessar o painel
        const SENHA_MESTRE_ADMIN = process.env.ADMIN_SENHA || 'elunari2026admin';

        if (senha !== SENHA_MESTRE_ADMIN) {
            return res.status(401).json({ error: 'Senha de administrador incorreta.' });
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'E-mail inválido.' });
        }

        // Cria uma chave única baseada no e-mail e em um hash aleatório
        const hashAleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
        const chaveGerada = `ELUNARI-${email.split('@')[0].toUpperCase()}-${hashAleatorio}`;

        // Calcula a data de expiração
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + parseInt(dias || 365));
        const validadeFormatada = dataExp.toISOString().split('T')[0];

        // Salva na lista
        LICENCAS_WEB[email.trim().toLowerCase()] = {
            chave: chaveGerada,
            validade: validadeFormatada
        };

        return res.status(200).json({
            sucesso: true,
            email: email,
            chave: chaveGerada,
            validade: validadeFormatada
        });
    }

    return res.status(405).json({ error: 'Método não permitido' });
};
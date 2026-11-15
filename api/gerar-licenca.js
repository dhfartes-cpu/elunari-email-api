const crypto = require('crypto');

module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Painel Web (GET)
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

    // Processamento da Geração Matemática (POST)
    if (req.method === 'POST') {
        const { senha, email, dias } = req.body;
        const SENHA_MESTRE_ADMIN = process.env.ADMIN_SENHA || 'Elunari@2026';

        if (senha !== SENHA_MESTRE_ADMIN) {
            return res.status(401).json({ error: 'Senha de administrador incorreta.' });
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'E-mail inválido.' });
        }

        const emailLimpo = email.trim().toLowerCase();
        const diasNum = parseInt(dias || 365);

        // Calcula a data de expiração exata
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + diasNum);
        const validadeFormatada = dataExp.toISOString().split('T')[0]; // Formato AAAA-MM-DD

        // Criação da assinatura matemática secreta usando o e-mail, a validade e a senha do admin
        const payload = `${emailLimpo}:${validadeFormatada}:${SENHA_MESTRE_ADMIN}`;
        const hashCripto = crypto.createHmac('sha256', SENHA_MESTRE_ADMIN)
                                 .update(payload)
                                 .digest('hex')
                                 .substring(0, 10)
                                 .toUpperCase();

        // Formato final da licença legível e profissional
        const prefixoEmail = emailLimpo.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
        const chaveGerada = `ELUNARI-${prefixoEmail}-${hashCripto}-${validadeFormatada.replace(/-/g, '')}`;

        return res.status(200).json({
            sucesso: true,
            email: emailLimpo,
            chave: chaveGerada,
            validade: validadeFormatada
        });
    }

    return res.status(405).json({ error: 'Método não permitido' });
};

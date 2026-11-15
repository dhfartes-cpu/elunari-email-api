// api/validar-licenca.js
const LICENCAS_ATIVAS = {
    // Formato: "CHAVE": { escola: "Nome da Escola", validade: "AAAA-MM-DD" }
    "ELUNARI-DEMO-2026-001": { escola: "Escola Teste Elunari", validade: "2027-11-15" },
    "ELUNARI-CAMOES-2026-88A": { escola: "Escola Luís de Camões", validade: "2027-11-15" }
};

module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { chave } = req.body;
    if (!chave) return res.status(400).json({ valida: false, mensagem: 'Informe a chave de licença.' });

    const licenca = LICENCAS_ATIVAS[chave.trim().toUpperCase()];

    if (!licenca) {
        return res.status(401).json({ valida: false, mensagem: 'Chave de licença inválida ou inexistente.' });
    }

    const hoje = new Date().toISOString().split('T')[0];
    if (hoje > licenca.validade) {
        return res.status(403).json({ valida: false, mensagem: `Licença expirada em ${licenca.validade}. Entre em contato com a Elunari Tech para renovar.` });
    }

    return res.status(200).json({
        valida: true,
        escola: licenca.escola,
        validade: licenca.validade
    });
};
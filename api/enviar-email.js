const nodemailer = require('nodemailer');

module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { para, assunto, texto, html } = req.body;

    if (!para || !assunto) {
        return res.status(400).json({ error: 'Destinatário e assunto são obrigatórios.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"LunareTech Horários" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: assunto,
            text: texto,
            html: html || `<p>${texto}</p>`
        });

        return res.status(200).json({ sucesso: true, mensagem: 'E-mail enviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar:', error);
        return res.status(500).json({ error: 'Falha no servidor de e-mail.', detalhe: error.message });
    }
};
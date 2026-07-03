const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

exports.login = async (req, res) => {
  try {
    const username = (req.body.username || req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!username) {
      return res.status(400).json({ error: `Nome de utilizador em falta. Recebemos: ${JSON.stringify(req.body)}` });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Password inválida.' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        disciplinaryGroupId: user.disciplinaryGroupId
      },
      JWT_SECRET,
      { expiresIn: 86400 } // 24 horas
    );

    res.status(200).json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      disciplinaryGroupId: user.disciplinaryGroupId,
      accessToken: token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

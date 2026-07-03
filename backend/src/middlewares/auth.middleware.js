const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

// Middleware genérico para garantir que o utilizador está logado
exports.verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  let tokenPart = '';

  if (token) {
    // Expecting "Bearer <token>"
    tokenPart = token.split(' ')[1] || token;
  } else if (req.query.token) {
    tokenPart = req.query.token;
  }

  if (!tokenPart) {
    return res.status(403).json({ error: 'Nenhum token fornecido.' });
  }

  jwt.verify(tokenPart, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Não autorizado. Token inválido ou expirado.' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userGroup = decoded.disciplinaryGroupId;
    next();
  });
};

// Middleware para restringir a papéis específicos
exports.requireRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.userRole || !rolesArray.includes(req.userRole)) {
      return res.status(403).json({ error: 'Acesso negado. Privilégios insuficientes.' });
    }
    next();
  };
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const evaluationRoutes = require('./routes/evaluation.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Servir o Frontend construído (dist)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all route para o Vue Router funcionar (qualquer rota que não seja /api devolve o index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Configuração Básica de Erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Ocorreu um erro no servidor!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Restart trigger 4

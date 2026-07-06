const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas as rotas de avaliações requerem login
router.use(verifyToken);

// Rota para obter dados do formulário
router.get('/my-data', evaluationController.getMyData);
router.get('/my-evaluations', evaluationController.getMyEvaluations);

// Rota para submeter uma avaliação
router.post('/', evaluationController.createEvaluation);

// Rota para exportar todas as avaliações do utilizador em ZIP
router.get('/export/zip', evaluationController.exportEvaluationsZip);

// Rota para gerar e descarregar o PDF da avaliação
router.get('/:id/pdf', evaluationController.generatePDF);

// Rotas para Editar e Apagar avaliação
router.put('/:id', evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);

module.exports = router;

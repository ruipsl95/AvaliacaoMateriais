const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

function populatePdfContent(doc, evaluation) {
  const logoPath = path.join(__dirname, '../assets/logo.png');
  const headerPath = path.join(__dirname, '../assets/header.png');

  // Título
  doc.fontSize(16).font('Helvetica-Bold')
     .text('Avaliação da qualidade dos materiais pedagógicos', { align: 'center' });
  doc.fontSize(12).font('Helvetica')
     .text('(sebentas dos módulos/UFCD)', { align: 'center' });
  doc.moveDown(2);

  // Meta-informação
  doc.fontSize(12).font('Helvetica');
  doc.text(`Ano letivo:  ${evaluation.schoolYear}`, { align: 'center' });
  doc.moveDown();
  
  // Metadados alinhados à esquerda com bold nas labels
  doc.font('Helvetica-Bold').text('Turma: ', { continued: true })
     .font('Helvetica').text(`${evaluation.subject.course.name}`);
     
  doc.font('Helvetica-Bold').text('Ano: ', { continued: true })
     .font('Helvetica').text(`${evaluation.subject.year || ''} `, { continued: true })
     .font('Helvetica-Bold').text('Disciplina: ', { continued: true })
     .font('Helvetica').text(`${evaluation.subject.name}`);

  doc.font('Helvetica-Bold').text('Módulos/ UFCD: ', { continued: true })
     .font('Helvetica').text(`${evaluation.modules}`);
     
  doc.font('Helvetica-Bold').text('Professor(a): ', { continued: true })
     .font('Helvetica').text(evaluation.teacher.name);
  
  doc.moveDown(0.5);

  // Critérios
  doc.font('Helvetica').fontSize(11);
  doc.text('Avalie cada questão numa classificação de 1 a 5, sendo:');
  doc.text('    1 – Muito fraco;  2 – Fraco;  3 – Suficiente;  4 – Bom;  5 - Excelente');
  doc.moveDown(1.5);

  // A, B, C, D
  doc.fontSize(13).font('Helvetica-Bold').text('A) ', { continued: true }).fontSize(11).font('Helvetica').text(`Adequação aos programas: ${evaluation.scoreAdequacy}`);
  doc.moveDown(0.7);
  doc.fontSize(13).font('Helvetica-Bold').text('B) ', { continued: true }).fontSize(11).font('Helvetica').text(`Qualidade científica dos textos, resumos, esquemas, questionários, ...: ${evaluation.scoreScientific}`);
  doc.moveDown(0.7);
  doc.fontSize(13).font('Helvetica-Bold').text('C) ', { continued: true }).fontSize(11).font('Helvetica').text(`Quantidade dos textos, resumos, esquemas, questionários,...: ${evaluation.scoreQuantity}`);
  doc.moveDown(0.7);
  doc.fontSize(13).font('Helvetica-Bold').text('D) ', { continued: true }).fontSize(11).font('Helvetica').text(`Bibliografia identificada: ${evaluation.scoreBibliography}`);
  doc.moveDown(1);

  // Justificação
  doc.fontSize(12).font('Helvetica').text('Justifique cada avaliação de 1, 2 e 3:');
  if (evaluation.justification && evaluation.justification.trim() !== '') {
    doc.moveDown(0.5);
    doc.text(evaluation.justification);
    doc.moveDown(1);
  } else {
    for(let i=0; i<4; i++) {
      doc.moveDown(1.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    }
    doc.moveDown(1);
  }

  // Direitos de autor
  const sim = evaluation.copyrightStatus === 'SIM' ? ' X ' : '___';
  const nao = evaluation.copyrightStatus === 'NAO' ? ' X ' : '___';
  const duvidas = evaluation.copyrightStatus === 'DUVIDAS' ? ' X ' : '___';
  
  doc.fontSize(13).font('Helvetica-Bold').text('E) ', { continued: true }).fontSize(11).font('Helvetica')
     .text('Os textos reproduzidos de publicações com direitos de autor excedem os');
  doc.text(`     10% de cada uma das publicações?  SIM ${sim}     NÃO ${nao}     DÚVIDAS ${duvidas}`);
  doc.moveDown(1.5);

  // Observações
  doc.fontSize(12).font('Helvetica').text('Observações: ');
  if (evaluation.observations && evaluation.observations.trim() !== '') {
    doc.moveDown(0.5);
    doc.text(evaluation.observations);
    doc.moveDown(1);
  } else {
    for(let i=0; i<3; i++) {
      doc.moveDown(1.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    }
    doc.moveDown(1.5);
  }

  // Assinaturas
  // Mover o cursor para perto do rodapé, desde que haja espaço
  if (doc.y < 650) {
    doc.y = 650;
  } else {
    doc.moveDown(2);
  }

  const formattedDate = new Date(evaluation.createdAt).toLocaleDateString('pt-PT');
  doc.text(`Data: ${formattedDate}   O/A Professor/a avaliador/a: `);
  // Move o cursor ligeiramente para cima e desenha a linha para assinar à frente do texto
  doc.moveTo(270, doc.y - 2).lineTo(545, doc.y - 2).stroke(); 

  // Adicionar cabeçalhos e rodapés a todas as páginas geradas
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 35, 20, { width: 100 });
    }
    if (fs.existsSync(headerPath)) {
      // A página tem 792px de altura. Colocamos em Y=715 para não cortar em baixo.
      doc.image(headerPath, 50, 715, { width: 500 });
    }
  }
}


exports.getMyData = async (req, res) => {
  try {
    let subjects = [];
    if (req.userRole === 'ADMIN' || !req.userGroup) {
      subjects = await prisma.subject.findMany({
        include: { course: true, teachers: true }
      });
    } else {
      subjects = await prisma.subject.findMany({
        where: { disciplinaryGroupId: req.userGroup },
        include: { course: true, teachers: true }
      });
    }
    
    // extrair cursos unicos das disciplinas
    const courseMap = new Map();
    subjects.forEach(s => {
      if (s.course && !courseMap.has(s.course.id)) {
        courseMap.set(s.course.id, s.course);
      }
    });
    const courses = Array.from(courseMap.values());

    const myEvals = await prisma.evaluation.findMany({
      where: { evaluatorId: req.userId },
      select: { subjectId: true }
    });
    const evaluatedSubjectIds = myEvals.map(e => e.subjectId);

    res.status(200).json({ courses, subjects, evaluatedSubjectIds });
  } catch (error) {
    console.error('Erro getMyData:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

/**
 * Retorna as avaliações do utilizador atual
 * GET /api/evaluations/my-evaluations
 */
exports.getMyEvaluations = async (req, res) => {
  try {
    const userId = req.userId;
    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatorId: userId },
      include: {
        teacher: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(evaluations);
  } catch (error) {
    console.error('Erro ao obter as minhas avaliações:', error);
    res.status(500).json({ error: 'Erro ao carregar as avaliações' });
  }
};

/**
 * Cria uma nova avaliação
 * POST /api/evaluations
 */
exports.createEvaluation = async (req, res) => {
  try {
    const {
      schoolYear,
      scoreAdequacy,
      scoreScientific,
      scoreQuantity,
      scoreBibliography,
      justification,
      copyrightStatus,
      observations,
      teacherId,
      subjectId,
      modules
    } = req.body;

    const evaluatorId = req.userId;
    const userRole = req.userRole;
    const userGroup = req.userGroup;

    // Regra de Negócio: Justificação é obrigatória se alguma nota <= 3
    const needsJustification = 
      scoreAdequacy <= 3 || 
      scoreScientific <= 3 || 
      scoreQuantity <= 3 || 
      scoreBibliography <= 3;

    if (needsJustification && (!justification || justification.trim() === '')) {
      return res.status(400).json({ 
        error: 'A justificação é obrigatória quando uma das avaliações é igual ou inferior a 3.' 
      });
    }

    // Verificar se o sujeito pode avaliar a disciplina
    if (userRole === 'EVALUATOR') {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject || subject.disciplinaryGroupId !== userGroup) {
        return res.status(403).json({ error: 'Acesso negado. A disciplina não pertence ao seu grupo disciplinar.' });
      }
    }

    // Persistir na base de dados com o Prisma
    const evaluation = await prisma.evaluation.create({
      data: {
        schoolYear,
        scoreAdequacy,
        scoreScientific,
        scoreQuantity,
        scoreBibliography,
        justification,
        copyrightStatus,
        observations,
        evaluator: { connect: { id: evaluatorId } },
        teacher: { connect: { id: teacherId } },
        modules,
        subject: { connect: { id: subjectId } }
      },
      include: {
        teacher: true,
        evaluator: true,
        subject: true
      }
    });

    return res.status(201).json(evaluation);

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao guardar a avaliação.' });
  }
};

/**
 * Gera o relatório em PDF de uma avaliação
 * GET /api/evaluations/:id/pdf
 */
exports.updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const existing = await prisma.evaluation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Não encontrada' });
    if (existing.evaluatorId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Não autorizado.' });
    }

    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        scoreAdequacy: req.body.scoreAdequacy,
        scoreScientific: req.body.scoreScientific,
        scoreQuantity: req.body.scoreQuantity,
        scoreBibliography: req.body.scoreBibliography,
        justification: req.body.justification,
        copyrightStatus: req.body.copyrightStatus,
        observations: req.body.observations
      }
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar avaliação.' });
  }
};

exports.deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const existing = await prisma.evaluation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Não encontrada' });
    if (existing.evaluatorId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Não autorizado.' });
    }

    await prisma.evaluation.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao apagar avaliação.' });
  }
};

exports.exportEvaluationsZip = async (req, res) => {
  try {
    const userId = req.userId;
    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatorId: userId },
      include: {
        teacher: true,
        evaluator: true,
        subject: { include: { course: true } }
      }
    });

    if (evaluations.length === 0) {
      return res.status(404).json({ error: 'Sem avaliações para exportar.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=minhas_avaliacoes.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const ev of evaluations) {
      const doc = new PDFDocument({ 
        margins: { top: 110, bottom: 100, left: 50, right: 50 },
        bufferPages: true 
      });
      populatePdfContent(doc, ev);
      doc.end();
      const filename = `Avaliacao_${ev.subject.name.replace(/\\/g, '_').replace(/ /g, '_')}_${ev.id}.pdf`;
      archive.append(doc, { name: filename });
    }

    archive.finalize();
  } catch (error) {
    console.error('Erro ZIP:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao exportar ZIP.' });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        teacher: true,
        evaluator: true,
        subject: { include: { course: true } }
      }
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Avaliação não encontrada.' });
    }

    // Configurar a resposta para streaming de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=avaliacao-${evaluation.id}.pdf`);

    // Inicializar PDFKit
    const doc = new PDFDocument({ 
      margins: { top: 110, bottom: 100, left: 50, right: 50 },
      bufferPages: true 
    });
    doc.pipe(res);

    populatePdfContent(doc, evaluation);

    // Finalizar o PDF
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    // Como a resposta pode já ter cabeçalhos de PDF, não fazemos res.json aqui se já estiver em stream.
    // Mas para efeitos do try/catch global:
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Ocorreu um erro interno ao gerar o PDF.' });
    }
  }
};

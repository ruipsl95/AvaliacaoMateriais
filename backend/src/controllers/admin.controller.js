const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const handleDeleteError = (error, res, entityName) => {
  if (error.code === 'P2003') {
    return res.status(400).json({ error: `Não é possível apagar ${entityName} pois já tem dados históricos associados.` });
  }
  return res.status(500).json({ error: `Erro ao apagar ${entityName}.` });
};

// CRUD para Utilizadores (Delegados, etc)
exports.createUser = async (req, res) => {
  try {
    const username = req.body.username ? req.body.username.trim().toLowerCase() : null;
    const { name, password, role, disciplinaryGroupId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = bcrypt.hashSync(password, 8);
    }

    const user = await prisma.user.create({
      data: {
        name,
        username: username || null,
        password: hashedPassword,
        role: role || 'EVALUATOR',
        disciplinaryGroupId: disciplinaryGroupId || null
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador.' });
  }
};

exports.getUsers = async (req, res) => {
  const users = await prisma.user.findMany({ include: { disciplinaryGroup: true } });
  res.status(200).json(users);
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, disciplinaryGroupId, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (disciplinaryGroupId !== undefined) data.disciplinaryGroupId = disciplinaryGroupId;
    if (password) data.password = bcrypt.hashSync(password, 8);

    const user = await prisma.user.update({ where: { id }, data });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar utilizador.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    handleDeleteError(error, res, 'este utilizador');
  }
};

// CRUD Grupos Disciplinares
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatório.' });
    const group = await prisma.disciplinaryGroup.create({ data: { name: name.trim() } });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar grupo.' });
  }
};

exports.getGroups = async (req, res) => {
  const groups = await prisma.disciplinaryGroup.findMany();
  res.status(200).json(groups);
};

exports.updateGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatório.' });
    const group = await prisma.disciplinaryGroup.update({
      where: { id: req.params.id },
      data: { name: name.trim() }
    });
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar grupo.' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await prisma.disciplinaryGroup.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    handleDeleteError(error, res, 'este grupo');
  }
};

// CRUD Disciplinas
exports.createSubject = async (req, res) => {
  try {
    const { name, disciplinaryGroupId, courseId, teacherIds, year } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatório.' });

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        year: year ? parseInt(year) : null,
        disciplinaryGroup: disciplinaryGroupId ? { connect: { id: disciplinaryGroupId } } : undefined,
        course: { connect: { id: courseId } },
        teachers: teacherIds && teacherIds.length > 0 ? { connect: teacherIds.map(id => ({ id })) } : undefined
      }
    });
    res.status(201).json(subject);
  } catch (error) {
    console.error('ERRO EM createSubject:', error);
    res.status(500).json({ error: 'Erro ao criar disciplina.' });
  }
};

exports.getSubjects = async (req, res) => {
  const subjects = await prisma.subject.findMany({ 
    include: { disciplinaryGroup: true, course: true, teachers: true } 
  });
  res.status(200).json(subjects);
};

exports.updateSubject = async (req, res) => {
  try {
    const { name, disciplinaryGroupId, courseId, teacherIds, year } = req.body;
    const data = {};
    if (name) data.name = name;
    if (year !== undefined) data.year = year ? parseInt(year) : null;
    if (disciplinaryGroupId !== undefined) data.disciplinaryGroupId = disciplinaryGroupId;
    if (courseId !== undefined) data.courseId = courseId;
    if (teacherIds !== undefined) {
      data.teachers = { set: teacherIds.map(id => ({ id })) };
    }

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data
    });
    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar disciplina.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    handleDeleteError(error, res, 'esta disciplina');
  }
};

// CRUD Cursos
exports.createCourse = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do curso obrigatório.' });
    }
    const course = await prisma.course.create({ data: { name: name.trim() } });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar curso.' });
  }
};

exports.getCourses = async (req, res) => {
  const courses = await prisma.course.findMany();
  res.status(200).json(courses);
};

exports.updateCourse = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Nome obrigatório.' });
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { name: name.trim() }
    });
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar curso.' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (error) {
    handleDeleteError(error, res, 'este curso');
  }
};

// Relatório: listar todas as avaliações
exports.getReports = async (req, res) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        teacher: true,
        evaluator: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter avaliações.' });
  }
};

// Dashboard KPIs
exports.getKpis = async (req, res) => {
  try {
    const allSubjects = await prisma.subject.findMany({
      include: { evaluations: true }
    });
    const missingSubjects = allSubjects.filter(s => s.evaluations.length === 0);

    const negativeEvaluations = await prisma.evaluation.findMany({
      where: {
        OR: [
          { scoreAdequacy: { lte: 3 } },
          { scoreScientific: { lte: 3 } },
          { scoreQuantity: { lte: 3 } },
          { scoreBibliography: { lte: 3 } }
        ]
      },
      include: { teacher: true, evaluator: true, subject: true }
    });

    res.status(200).json({
      missingSubjects: { count: missingSubjects.length, items: missingSubjects },
      negativeEvaluations: { count: negativeEvaluations.length, items: negativeEvaluations }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular KPIs.' });
  }
};

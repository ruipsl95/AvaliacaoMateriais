const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Todas as rotas admin requerem ser Admin
router.use(verifyToken);
router.use(requireRole(['ADMIN']));

router.post('/users', adminController.createUser);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.post('/groups', adminController.createGroup);
router.get('/groups', adminController.getGroups);
router.put('/groups/:id', adminController.updateGroup);
router.delete('/groups/:id', adminController.deleteGroup);

router.post('/subjects', adminController.createSubject);
router.get('/subjects', adminController.getSubjects);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

router.post('/courses', adminController.createCourse);
router.get('/courses', adminController.getCourses);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

router.get('/reports', adminController.getReports);
router.get('/kpis', adminController.getKpis);

module.exports = router;

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './style.css';
import App from './App.vue';
import EvaluationForm from './components/EvaluationForm.vue';
import LoginView from './views/LoginView.vue';
import AdminDashboard from './views/AdminDashboard.vue';

const routes = [
  { 
    path: '/login', 
    component: LoginView 
  },
  { 
    path: '/', 
    component: EvaluationForm,
    meta: { requiresAuth: true }
  },
  { 
    path: '/admin', 
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth Guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresAdmin && user.role !== 'ADMIN') {
    next('/');
  } else {
    next();
  }
});

const app = createApp(App);
app.use(router);
app.mount('#app');

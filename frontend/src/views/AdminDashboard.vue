<template>
  <div class="admin-container">
    <div class="glass-panel admin-box">
      <header class="header flex-between">
        <h1>Dashboard - Administrador</h1>
        <button @click="logout" class="btn-sm btn-danger">Terminar Sessão</button>
      </header>
      
      <div class="tabs">
        <button :class="{ active: tab === 'dashboard' }" @click="tab = 'dashboard'">Dashboard (KPIs)</button>
        <button :class="{ active: tab === 'users' }" @click="tab = 'users'">Delegados</button>
        <button :class="{ active: tab === 'structure' }" @click="tab = 'structure'">Estrutura da Escola</button>
        <button :class="{ active: tab === 'reports' }" @click="tab = 'reports'">Relatórios Finais</button>
      </div>

      <!-- MESSAGES -->
      <div v-if="message" class="message success">{{ message }}</div>
      <div v-if="error" class="message error">{{ error }}</div>

      <!-- TAB: DASHBOARD -->
      <div class="tab-content" v-if="tab === 'dashboard'">
        <h2>Métricas em Tempo Real</h2>
        <div class="kpi-grid">
          <!-- KPI: Missing -->
          <div class="kpi-card" @click="activeKpi = (activeKpi === 'missing' ? null : 'missing')">
            <div class="kpi-number">{{ kpis.missingSubjects.count }}</div>
            <div class="kpi-label">Disciplinas sem Avaliação</div>
            <small>Clique para ver detalhes</small>
          </div>

          <!-- KPI: Negative -->
          <div class="kpi-card negative" @click="activeKpi = (activeKpi === 'negative' ? null : 'negative')">
            <div class="kpi-number">{{ kpis.negativeEvaluations.count }}</div>
            <div class="kpi-label">Avaliações Negativas (≤3)</div>
            <small>Clique para ver detalhes</small>
          </div>
        </div>

        <!-- DETAILS: Missing -->
        <div v-if="activeKpi === 'missing'" class="kpi-details">
          <h3>Disciplinas que faltam avaliar</h3>
          <ul>
            <li v-for="s in kpis.missingSubjects.items" :key="s.id">{{ s.name }}</li>
            <li v-if="kpis.missingSubjects.count === 0" class="text-gray">Nenhuma disciplina em falta. Excelente!</li>
          </ul>
        </div>

        <!-- DETAILS: Negative -->
        <div v-if="activeKpi === 'negative'" class="kpi-details">
          <h3>Avaliações com nota ≤ 3</h3>
          <ul>
            <li v-for="e in kpis.negativeEvaluations.items" :key="e.id">
              <strong>{{ e.subject.name }}</strong> (Avaliador: {{ e.evaluator.name }}, Prof: {{ e.teacher.name }})
            </li>
            <li v-if="kpis.negativeEvaluations.count === 0" class="text-gray">Nenhuma avaliação negativa!</li>
          </ul>
        </div>
      </div>

      <!-- TAB: ESTRUTURA -->
      <div class="tab-content" v-if="tab === 'structure'">
        <div class="grid-2">
          
          <!-- Add Course -->
          <div class="form-card full-width">
            <h3>1. Novo Curso</h3>
            <form @submit.prevent="addCourse" class="flex-form">
              <input type="text" v-model="newCourse.name" placeholder="Ex: Técnico de Informática de Gestão" required />
              <button type="submit" class="btn-sm">Criar Curso</button>
            </form>
            <ul class="list-mini">
              <li v-for="c in courses" :key="c.id" class="flex-between">
                <span>{{ c.name }}</span>
                <div>
                  <button @click="editName('courses', c.id, c.name, fetchCourses)" class="btn-icon">✏️</button>
                  <button @click="deleteEntity('courses', c.id, fetchCourses)" class="btn-icon">✖</button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Add Group -->
          <div class="form-card">
            <h3>2. Novo Grupo Disciplinar</h3>
            <form @submit.prevent="addGroup">
              <input type="text" v-model="newGroup.name" placeholder="Ex: Informática" required />
              <button type="submit" class="btn-sm">Criar Grupo</button>
            </form>
            <ul class="list-mini">
              <li v-for="g in groups" :key="g.id" class="flex-between">
                <span>{{ g.name }}</span>
                <div>
                  <button @click="editName('groups', g.id, g.name, fetchGroups)" class="btn-icon">✏️</button>
                  <button @click="deleteEntity('groups', g.id, fetchGroups)" class="btn-icon">✖</button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Add Teacher -->
          <div class="form-card">
            <h3>3. Novo Professor (Avaliado)</h3>
            <form @submit.prevent="addTeacher">
              <input type="text" v-model="newTeacher.name" placeholder="Nome Completo do Professor" required />
              <button type="submit" class="btn-sm">Criar Professor</button>
            </form>
            <ul class="list-mini">
              <li v-for="t in teachers" :key="t.id" class="flex-between">
                <span>{{ t.name }}</span>
                <div>
                  <button @click="editName('users', t.id, t.name, fetchUsers)" class="btn-icon">✏️</button>
                  <button @click="deleteEntity('users', t.id, fetchUsers)" class="btn-icon">✖</button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Add Subject -->
          <div class="form-card full-width">
            <h3>4. Nova Disciplina</h3>
            <form @submit.prevent="addSubject" class="grid-form">
              <input type="text" v-model="newSubject.name" placeholder="Nome da Disciplina (ex: Inglês)" required />
              <input type="number" v-model="newSubject.year" placeholder="Ano (opcional, ex: 10)" />
              
              <select v-model="newSubject.courseId" required>
                <option value="" disabled>Selecionar Curso...</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>

              <select v-model="newSubject.disciplinaryGroupId" required>
                <option value="" disabled>Selecionar Grupo...</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>

              <div class="checkbox-list" style="grid-column: 1 / -1; max-height: 120px; overflow-y: auto; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 8px;">
                <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Professores a ministrar:</p>
                <label v-for="t in teachers" :key="t.id" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.3rem; cursor: pointer;">
                  <input type="checkbox" :value="t.id" v-model="newSubject.teacherIds" style="margin: 0; width: auto; height: auto;" />
                  <span>{{ t.name }}</span>
                </label>
              </div>

              <button type="submit" class="btn-sm" style="grid-column: 1 / -1;">Criar Disciplina</button>
            </form>
            <ul class="list-mini">
              <li v-for="s in subjects" :key="s.id" class="flex-between">
                <span><strong>{{ s.name }}</strong> {{ s.year ? `(${s.year}º Ano)` : '' }} ({{ s.course?.name }}) - Grupo: {{ s.disciplinaryGroup?.name }} - Profs: {{ s.teachers?.map(t => t.name).join(', ') || 'Nenhum' }}</span>
                <div>
                  <button @click="editName('subjects', s.id, s.name, fetchSubjects)" class="btn-icon">✏️</button>
                  <button @click="deleteEntity('subjects', s.id, fetchSubjects)" class="btn-icon">✖</button>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <!-- TAB: USERS -->
      <div class="tab-content" v-if="tab === 'users'">
        <h2>Gestão de Delegados</h2>
        
        <div class="form-card">
          <h3>Adicionar Utilizador</h3>
          <form @submit.prevent="addUser" class="grid-form">
            <input type="text" v-model="newUser.name" placeholder="Nome Completo" required />
            <input type="text" v-model="newUser.username" placeholder="Username (Ex: rsousa)" required />
            <input type="password" v-model="newUser.password" placeholder="Password" required />
            <select v-model="newUser.role">
              <option value="EVALUATOR">Delegado (Avaliador)</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <select v-model="newUser.disciplinaryGroupId" v-if="newUser.role === 'EVALUATOR'">
              <option value="">Nenhum Grupo</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
            <button type="submit" class="btn-sm">Criar Utilizador</button>
          </form>
        </div>

        <table v-if="users.length > 0" class="mt-4">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Username</th>
              <th>Role</th>
              <th>Grupo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in delegates" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.role }}</td>
              <td>{{ u.disciplinaryGroup?.name || '-' }}</td>
              <td>
                <button @click="openEditUser(u)" class="btn-icon">✏️</button>
                <button @click="deleteEntity('users', u.id, fetchUsers)" class="btn-icon">✖</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: REPORTS -->
      <div class="tab-content" v-if="tab === 'reports'">
        <h2>Avaliações Submetidas</h2>
        <button @click="fetchReports" class="btn-refresh">Atualizar Dados</button>
        <div class="table-container">
          <table v-if="reports.length > 0">
            <thead>
              <tr>
                <th>Data</th>
                <th>Avaliador</th>
                <th>Professor</th>
                <th>Disciplina</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reports" :key="r.id">
                <td>{{ new Date(r.createdAt).toLocaleDateString('pt-PT') }}</td>
                <td>{{ r.evaluator.name }}</td>
                <td>{{ r.teacher.name }}</td>
                <td>{{ r.subject.name }}</td>
                <td>
                  <button @click="downloadPdf(r.id)" class="btn-sm">Gerar PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else>Nenhuma avaliação submetida ainda.</p>
        </div>
      </div>

    </div>

    <!-- MODAL DE EDIÇÃO DE UTILIZADOR -->
    <div v-if="editingUser" class="modal-overlay">
      <div class="modal-content">
        <h3>Editar Utilizador</h3>
        <form @submit.prevent="submitEditUser">
          <label>Nome:</label>
          <input type="text" v-model="editingUser.name" required />
          
          <label>Role (Cargo):</label>
          <select v-model="editingUser.role" required>
            <option value="TEACHER">Professor (Avaliado)</option>
            <option value="EVALUATOR">Delegado (Avaliador)</option>
            <option value="ADMIN">Administrador</option>
          </select>
          
          <label v-if="editingUser.role === 'EVALUATOR'">Grupo Disciplinar:</label>
          <select v-model="editingUser.disciplinaryGroupId" v-if="editingUser.role === 'EVALUATOR'">
            <option value="">Nenhum Grupo</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>

          <label>Nova Password (opcional):</label>
          <input type="password" v-model="editingUser.password" placeholder="Deixe em branco para manter" />
          
          <div class="modal-actions">
            <button type="button" @click="editingUser = null" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save">Guardar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const tab = ref('dashboard');
const activeKpi = ref(null);

const message = ref('');
const error = ref('');

// State
const reports = ref([]);
const users = ref([]);
const groups = ref([]);
const subjects = ref([]);
const courses = ref([]);
const kpis = ref({
  missingSubjects: { count: 0, items: [] },
  negativeEvaluations: { count: 0, items: [] }
});

const delegates = computed(() => users.value.filter(u => u.role !== 'TEACHER'));
const teachers = computed(() => users.value); // Todos podem lecionar (inclusive Delegados e Admin)

// Forms
const newGroup = ref({ name: '' });
const newSubject = ref({ name: '', year: null, courseId: '', disciplinaryGroupId: '', teacherIds: [] });
const newCourse = ref({ name: '' });
const newUser = ref({ name: '', username: '', password: '', role: 'EVALUATOR', disciplinaryGroupId: '' });
const newTeacher = ref({ name: '', role: 'TEACHER' });
const editingUser = ref(null);

const getToken = () => localStorage.getItem('token');

const authFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...options.headers
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'Erro na requisição');
  }
  return res.json();
};

const showMessage = (msg, isError = false) => {
  if (isError) error.value = msg;
  else message.value = msg;
  setTimeout(() => {
    error.value = '';
    message.value = '';
  }, 3000);
};

// Fetchers
const fetchKpis = async () => { kpis.value = await authFetch('/api/admin/kpis'); };
const fetchReports = async () => { reports.value = await authFetch('/api/admin/reports'); };
const fetchUsers = async () => { users.value = await authFetch('/api/admin/users'); };
const fetchGroups = async () => { groups.value = await authFetch('/api/admin/groups'); };
const fetchSubjects = async () => { subjects.value = await authFetch('/api/admin/subjects'); };
const fetchCourses = async () => { courses.value = await authFetch('/api/admin/courses'); };

const loadAllData = async () => {
  try {
    await Promise.all([
      fetchKpis(),
      fetchReports(),
      fetchUsers(),
      fetchGroups(),
      fetchSubjects(),
      fetchCourses()
    ]);
  } catch (err) {
    showMessage(err.message, true);
  }
};

// Actions
const addGroup = async (e) => {
  try {
    const { name } = newGroup.value;
    if (!name) return;
    await authFetch('/api/admin/groups', { method: 'POST', body: JSON.stringify({ name }) });
    newGroup.value.name = '';
    showMessage('Grupo criado!');
    fetchGroups();
  } catch (err) { showMessage(err.message, true); }
};

const addSubject = async (e) => {
  if (newSubject.value.teacherIds.length === 0) {
    showMessage('Selecione pelo menos um professor.', true);
    return;
  }
  try {
    await authFetch('/api/admin/subjects', { 
      method: 'POST', 
      body: JSON.stringify(newSubject.value) 
    });
    newSubject.value = { name: '', year: null, courseId: '', disciplinaryGroupId: '', teacherIds: [] };
    showMessage('Disciplina criada!');
    fetchSubjects();
    fetchKpis();
  } catch (err) { showMessage(err.message, true); }
};

const addCourse = async (e) => {
  try {
    const { name } = newCourse.value;
    if (!name) return;
    await authFetch('/api/admin/courses', { method: 'POST', body: JSON.stringify({ name }) });
    newCourse.value.name = '';
    showMessage('Curso criado!');
    fetchCourses();
  } catch (err) { showMessage(err.message, true); }
};

const addTeacher = async (e) => {
  try {
    const { name } = newTeacher.value;
    if (!name) return;
    await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ ...newTeacher.value, username: 'prof_' + Date.now(), password: '123' }) });
    newTeacher.value.name = '';
    showMessage('Professor criado!');
    fetchUsers();
  } catch (err) { showMessage(err.message, true); }
};

const addUser = async (e) => {
  try {
    const body = { ...newUser.value };
    if (!body.name || !body.username || !body.password) return;
    await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) });
    newUser.value = { name: '', username: '', password: '', role: 'EVALUATOR', disciplinaryGroupId: '' };
    showMessage('Utilizador criado!');
    fetchUsers();
  } catch (err) { showMessage(err.message, true); }
};

// Generic Edit/Delete Actions
const deleteEntity = async (endpoint, id, refreshCb) => {
  if (!confirm('Tem a certeza que deseja apagar?')) return;
  try {
    await authFetch(`/api/admin/${endpoint}/${id}`, { method: 'DELETE' });
    showMessage('Apagado com sucesso!');
    refreshCb();
    if (endpoint === 'subjects' || endpoint === 'courses') fetchKpis();
  } catch (err) {
    showMessage(err.message, true);
  }
};

const openEditUser = (user) => {
  editingUser.value = { ...user, password: '' };
};

const submitEditUser = async () => {
  try {
    const payload = {
      name: editingUser.value.name,
      role: editingUser.value.role,
      disciplinaryGroupId: editingUser.value.role === 'EVALUATOR' ? (editingUser.value.disciplinaryGroupId || null) : null
    };
    if (editingUser.value.password) {
      payload.password = editingUser.value.password;
    }
    await authFetch(`/api/admin/users/${editingUser.value.id}`, { 
      method: 'PUT', 
      body: JSON.stringify(payload) 
    });
    showMessage('Utilizador atualizado com sucesso!');
    editingUser.value = null;
    fetchUsers();
  } catch (err) {
    showMessage(err.message, true);
  }
};

const editName = async (endpoint, id, currentName, refreshCb) => {
  const newName = prompt('Novo nome:', currentName);
  if (!newName || newName.trim() === '' || newName === currentName) return;
  try {
    await authFetch(`/api/admin/${endpoint}/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ name: newName.trim() }) 
    });
    showMessage('Nome atualizado!');
    refreshCb();
  } catch (err) {
    showMessage(err.message, true);
  }
};

const downloadPdf = (id) => {
  window.open(`/api/evaluations/${id}/pdf?token=${getToken()}`, '_blank');
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  loadAllData();
});

watch(tab, () => {
  // refresh relevant data when changing tabs could be a good idea, or just let loadAllData do it initially
  if (tab.value === 'dashboard') fetchKpis();
});
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
}

.admin-box {
  max-width: 1100px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-logout {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.tabs button {
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.tabs button.active {
  background: #e0e7ff;
  color: #3b82f6;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}
.message.success { background: #dcfce7; color: #166534; }
.message.error { background: #fee2e2; color: #991b1b; }

/* Dashboard KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}
.kpi-card.negative:hover { border-color: #ef4444; }

.kpi-number {
  font-size: 3rem;
  font-weight: 800;
  color: #3b82f6;
  line-height: 1;
  margin-bottom: 0.5rem;
}
.kpi-card.negative .kpi-number { color: #ef4444; }

.kpi-label {
  font-weight: 600;
  color: #475569;
}

.kpi-details {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 2rem;
}
.kpi-details h3 { margin-top: 0; color: #1e293b; }
.kpi-details ul { padding-left: 1.5rem; }
.kpi-details li { margin-bottom: 0.5rem; }
.text-gray { color: #64748b; font-style: italic; }

/* Forms & Grids */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.full-width { grid-column: 1 / -1; }

.form-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.form-card h3 { margin-top: 0; margin-bottom: 1rem; color: #1e293b; }
.form-card input, .form-card select {
  width: 100%;
  padding: 0.6rem;
  margin-bottom: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
.flex-form { display: flex; gap: 1rem; align-items: flex-start; }
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center; }
.grid-form .btn-sm { grid-column: 1 / -1; }

.list-mini {
  margin-top: 1rem;
  max-height: 150px;
  overflow-y: auto;
  padding-left: 1.2rem;
  font-size: 0.9rem;
}

/* Tables */
.table-container { margin-top: 1rem; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.8rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
th { background: #f1f5f9; font-weight: 600; }
.mt-4 { margin-top: 1.5rem; }

/* Buttons */
.btn-sm {
  background: #3b82f6; color: white; border: none;
  padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;
}
.btn-sm:hover { background: #2563eb; }
.btn-refresh {
  background: #10b981; color: white; border: none;
  padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500;
  margin-bottom: 1rem;
}

.flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.2rem; transition: transform 0.2s; }
.btn-icon:hover { transform: scale(1.1); }
.text-red { color: #ef4444; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #1e293b;
}
.modal-content label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #475569;
}
.modal-content input, .modal-content select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  margin-bottom: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn-cancel {
  background: #e2e8f0;
  color: #475569;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-save {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-save:hover {
  background: #2563eb;
}
</style>

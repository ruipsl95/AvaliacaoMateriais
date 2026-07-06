<template>
  <div class="evaluation-container">
    <header class="page-header">
      <h1>Painel do Avaliador</h1>
      <div class="user-info">
        <span class="welcome-text">Bem-vindo(a), {{ user.name || 'Delegado' }}</span>
        <button @click="logout" class="btn-sm btn-danger">Terminar Sessão</button>
      </div>
    </header>

    <div class="tabs">
      <button :class="{ active: tab === 'new' }" @click="tab = 'new'">Nova Avaliação</button>
      <button :class="{ active: tab === 'history' }" @click="tab = 'history'; fetchMyEvaluations()">Minhas Avaliações</button>
    </div>

    <div class="glass-panel" v-if="tab === 'new'">
      <header class="form-header">
        <h1>Avaliação de Materiais Pedagógicos</h1>
        <p>Preencha os critérios de avaliação e gere o relatório oficial (Modelo 260DP.01).</p>
      </header>

      <form @submit.prevent="submitEvaluation" class="evaluation-form">
        
        <!-- SECÇÃO 1: METADADOS -->
        <section class="form-section">
          <h2>1. Identificação</h2>
          <div class="form-grid">
            <div class="input-group">
              <label>Ano Letivo</label>
              <input type="text" v-model="form.schoolYear" placeholder="Ex: 2025/2026" required />
            </div>

            <div class="input-group">
              <label>Disciplina</label>
              <select v-model="form.subjectId" required>
                <option value="" disabled>Selecione a disciplina...</option>
                <option v-for="subject in availableSubjects" :key="subject.id" :value="subject.id">
                  {{ subject.name }} ({{ getCourseAbbr(subject.course?.name) }}{{ subject.year || '' }})
                </option>
              </select>
            </div>

            <div class="input-group">
              <label>Curso</label>
              <input type="text" :value="selectedCourseName" disabled placeholder="Preenchido automaticamente" />
            </div>

            <div class="input-group">
              <label>Professor Avaliado</label>
              <select v-model="form.teacherId" :disabled="!form.subjectId" required>
                <option value="" disabled>Selecione o professor...</option>
                <option v-for="teacher in subjectTeachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <label>Módulo(s) / UFCD</label>
              <input type="text" v-model="form.modules" placeholder="Ex: 1, 2 e 3" required />
            </div>
          </div>
        </section>

        <!-- SECÇÃO 2: CRITÉRIOS -->
        <section class="form-section">
          <h2>2. Critérios de Avaliação</h2>
          <p class="legend">1 – Muito fraco | 2 – Fraco | 3 – Suficiente | 4 – Bom | 5 - Excelente</p>
          
          <div class="criteria-list">
            <div class="criterion">
              <label>A) Adequação aos programas</label>
              <div class="rating-group">
                <label v-for="n in 5" :key="`A-${n}`" class="rating-label">
                  <input type="radio" v-model="form.scoreAdequacy" :value="n" required />
                  <span>{{ n }}</span>
                </label>
              </div>
            </div>

            <div class="criterion">
              <label>B) Qualidade científica dos textos, resumos, esquemas, questionários...</label>
              <div class="rating-group">
                <label v-for="n in 5" :key="`B-${n}`" class="rating-label">
                  <input type="radio" v-model="form.scoreScientific" :value="n" required />
                  <span>{{ n }}</span>
                </label>
              </div>
            </div>

            <div class="criterion">
              <label>C) Quantidade dos textos, resumos, esquemas, questionários...</label>
              <div class="rating-group">
                <label v-for="n in 5" :key="`C-${n}`" class="rating-label">
                  <input type="radio" v-model="form.scoreQuantity" :value="n" required />
                  <span>{{ n }}</span>
                </label>
              </div>
            </div>

            <div class="criterion">
              <label>D) Bibliografia identificada</label>
              <div class="rating-group">
                <label v-for="n in 5" :key="`D-${n}`" class="rating-label">
                  <input type="radio" v-model="form.scoreBibliography" :value="n" required />
                  <span>{{ n }}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- SECÇÃO 3: JUSTIFICAÇÃO (CONDICIONAL) -->
        <transition name="fade">
          <section class="form-section warning-section" v-if="requiresJustification">
            <h2>Justificação Obrigatória</h2>
            <p>Atribuiu uma classificação igual ou inferior a 3. Por favor, justifique.</p>
            <div class="input-group">
              <textarea 
                v-model="form.justification" 
                rows="4" 
                placeholder="Insira a sua justificação aqui..."
                :required="requiresJustification"
              ></textarea>
            </div>
          </section>
        </transition>

        <!-- SECÇÃO 4: DIREITOS DE AUTOR & OBSERVAÇÕES -->
        <section class="form-section">
          <h2>3. Informações Adicionais</h2>
          
          <div class="input-group copyright-group">
            <label>E) Os textos reproduzidos de publicações com direitos de autor excedem os 10% de cada uma das publicações?</label>
            <div class="radio-options">
              <label><input type="radio" v-model="form.copyrightStatus" value="SIM" required /> SIM</label>
              <label><input type="radio" v-model="form.copyrightStatus" value="NAO" required /> NÃO</label>
              <label><input type="radio" v-model="form.copyrightStatus" value="DUVIDAS" required /> DÚVIDAS</label>
            </div>
          </div>

          <div class="input-group">
            <label>Observações (Opcional)</label>
            <textarea v-model="form.observations" rows="3" placeholder="Notas adicionais..."></textarea>
          </div>
        </section>

        <!-- SUBMIT -->
        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Submeter e Gerar PDF</span>
            <span v-else class="loader"></span>
          </button>
        </div>

      </form>
    </div>

    <!-- TAB: MINHAS AVALIAÇÕES -->
    <div class="glass-panel glass-panel-history" v-if="tab === 'history'">
      <header class="form-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 1rem;">
        <div style="text-align: left;">
          <h1>Minhas Avaliações</h1>
          <p>Consulte, edite ou exporte o histórico das suas submissões.</p>
        </div>
        <button @click="exportZip" class="btn-sm btn-primary export-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar Todas (ZIP)
        </button>
      </header>

      <div class="table-container" v-if="myEvaluations.length > 0">
        <table class="styled-table">
          <thead>
            <tr>
              <th width="10%">Data</th>
              <th width="30%">Disciplina</th>
              <th width="15%">Turma</th>
              <th width="20%">Professor(a)</th>
              <th width="15%">Relatório</th>
              <th width="10%">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in myEvaluations" :key="ev.id">
              <td class="col-date">{{ new Date(ev.createdAt).toLocaleDateString('pt-PT') }}</td>
              <td class="col-subject"><strong>{{ ev.subject?.name }}</strong></td>
              <td><span class="badge">{{ ev.subject?.course?.name || 'N/A' }}</span></td>
              <td class="col-teacher">👨‍🏫 {{ ev.teacher?.name }}</td>
              <td>
                <button @click="downloadPdf(ev.id)" class="btn-action pdf-btn">
                  📄 Gerar PDF
                </button>
              </td>
              <td class="col-actions">
                <button @click="openEditModal(ev)" class="btn-icon" title="Editar Avaliação">✏️</button>
                <button @click="deleteEvaluation(ev.id, ev.subjectId)" class="btn-icon text-red" title="Apagar Avaliação">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📁</div>
        <p>Ainda não realizou nenhuma avaliação.</p>
      </div>
    </div>

    <!-- MODAL DE EDIÇÃO DE AVALIAÇÃO -->
    <div v-if="editingEvaluation" class="modal-overlay">
      <div class="modal-content evaluation-modal">
        <h3>Editar Avaliação</h3>
        <p><strong>Disciplina:</strong> {{ editingEvaluation.subject?.name }}</p>
        <p><strong>Professor:</strong> {{ editingEvaluation.teacher?.name }}</p>
        <hr/>
        <form @submit.prevent="submitEditEvaluation">
          
          <div class="modal-grid">
            <div class="input-group">
              <label>A) Adequação aos programas (1-5)</label>
              <input type="number" min="1" max="5" v-model="editForm.scoreAdequacy" required />
            </div>
            <div class="input-group">
              <label>B) Qualidade científica (1-5)</label>
              <input type="number" min="1" max="5" v-model="editForm.scoreScientific" required />
            </div>
            <div class="input-group">
              <label>C) Quantidade de textos (1-5)</label>
              <input type="number" min="1" max="5" v-model="editForm.scoreQuantity" required />
            </div>
            <div class="input-group">
              <label>D) Bibliografia (1-5)</label>
              <input type="number" min="1" max="5" v-model="editForm.scoreBibliography" required />
            </div>
          </div>

          <div class="input-group" v-if="requiresEditJustification">
            <label>Justificação Obrigatória (Notas <= 3)</label>
            <textarea v-model="editForm.justification" rows="3" required></textarea>
          </div>

          <div class="input-group">
            <label>E) Direitos de autor excedem 10%?</label>
            <select v-model="editForm.copyrightStatus" required>
              <option value="SIM">SIM</option>
              <option value="NAO">NÃO</option>
              <option value="DUVIDAS">DÚVIDAS</option>
            </select>
          </div>

          <div class="input-group">
            <label>Observações</label>
            <textarea v-model="editForm.observations" rows="2"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="editingEvaluation = null" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-submit-modal" :disabled="isSubmittingEdit">Guardar e Atualizar PDF</button>
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
const tab = ref('new');
const myEvaluations = ref([]);

// Estado do Formulário
const form = ref({
  schoolYear: '2025/2026',
  courseId: '',
  subjectId: '',
  teacherId: '',
  modules: '',
  scoreAdequacy: null,
  scoreScientific: null,
  scoreQuantity: null,
  scoreBibliography: null,
  justification: '',
  copyrightStatus: '',
  observations: ''
});

const isSubmitting = ref(false);
const user = JSON.parse(localStorage.getItem('user') || '{}');

const courses = ref([]);
const allSubjects = ref([]);
const evaluatedSubjectIds = ref([]);
const teachers = ref([]);

const courseAbbrs = {
  'Informática de Gestão': 'INF',
  'Vendas e Marketing': 'VM',
  'Turismo': 'TUR',
  'Mecânico de Aeronaves': 'MEC.AERO',
  'Mecânica Automóvel': 'MEC.AUTO',
  'Mecânica': 'MEC',
  'Restaurante/Bar': 'REST/BAR',
  'Cozinha/Pastelaria': 'COZ',
  'Auxiliar de Saúde': 'AS',
  'Desporto': 'DESP',
  'Curso de Educação e Formação': 'CEF'
};
const getCourseAbbr = (courseName) => courseName ? (courseAbbrs[courseName] || courseName) : '';

const availableSubjects = computed(() => {
  return allSubjects.value.filter(s => !evaluatedSubjectIds.value.includes(s.id));
});

const editingEvaluation = ref(null);
const editForm = ref({});
const isSubmittingEdit = ref(false);

const requiresEditJustification = computed(() => {
  return (
    editForm.value.scoreAdequacy <= 3 ||
    editForm.value.scoreScientific <= 3 ||
    editForm.value.scoreQuantity <= 3 ||
    editForm.value.scoreBibliography <= 3
  );
});

// Computed Property para Regra de Negócio Dinâmica
const requiresJustification = computed(() => {
  return (
    (form.value.scoreAdequacy && form.value.scoreAdequacy <= 3) ||
    (form.value.scoreScientific && form.value.scoreScientific <= 3) ||
    (form.value.scoreQuantity && form.value.scoreQuantity <= 3) ||
    (form.value.scoreBibliography && form.value.scoreBibliography <= 3)
  );
});

const selectedCourseName = computed(() => {
  if (!form.value.subjectId) return '';
  const subj = allSubjects.value.find(s => s.id === form.value.subjectId);
  return subj && subj.course ? subj.course.name : '';
});

const subjectTeachers = computed(() => {
  if (!form.value.subjectId) return [];
  const subj = allSubjects.value.find(s => s.id === form.value.subjectId);
  return subj && subj.teachers ? subj.teachers : [];
});

watch(() => form.value.subjectId, (newSubjectId) => {
  if (newSubjectId) {
    const subj = allSubjects.value.find(s => s.id === newSubjectId);
    if (subj) {
      form.value.courseId = subj.courseId;
      // Auto-select se só houver 1 professor, caso contrário limpa para obrigar a escolher
      if (subj.teachers && subj.teachers.length === 1) {
        form.value.teacherId = subj.teachers[0].id;
      } else {
        form.value.teacherId = '';
      }
    }
  } else {
    form.value.courseId = '';
    form.value.teacherId = '';
  }
});

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/evaluations/my-data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    courses.value = data.courses;
    allSubjects.value = data.subjects;
    evaluatedSubjectIds.value = data.evaluatedSubjectIds || [];
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
});

const submitEvaluation = async () => {
  if (requiresJustification.value && !form.value.justification.trim()) {
    alert('A justificação é obrigatória!');
    return;
  }

  isSubmitting.value = true;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    });

    if (!response.ok) throw new Error('Erro ao submeter avaliação');
    
    const result = await response.json();
    evaluatedSubjectIds.value.push(form.value.subjectId);
    
    // Limpar o form para uma nova submissão
    form.value.subjectId = '';
    form.value.teacherId = '';
    form.value.modules = '';
    form.value.scoreAdequacy = null;
    form.value.scoreScientific = null;
    form.value.scoreQuantity = null;
    form.value.scoreBibliography = null;
    form.value.justification = '';
    form.value.copyrightStatus = '';
    form.value.observations = '';

    downloadPdf(result.id);
    alert('Avaliação submetida com sucesso!');
    
  } catch (error) {
    console.error(error);
    alert('Ocorreu um erro ao submeter a avaliação.');
  } finally {
    isSubmitting.value = false;
  }
};

const fetchMyEvaluations = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/evaluations/my-evaluations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      myEvaluations.value = await response.json();
    }
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
  }
};

const deleteEvaluation = async (id, subjectId) => {
  if (!confirm('Tem a certeza que deseja apagar esta avaliação? Esta ação é irreversível.')) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/evaluations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao apagar');
    
    // Remover da lista de history
    myEvaluations.value = myEvaluations.value.filter(ev => ev.id !== id);
    // Adicionar disciplina de volta à combobox
    evaluatedSubjectIds.value = evaluatedSubjectIds.value.filter(sId => sId !== subjectId);
    
  } catch(error) {
    alert(error.message);
  }
};

const openEditModal = (ev) => {
  editingEvaluation.value = ev;
  editForm.value = {
    scoreAdequacy: ev.scoreAdequacy,
    scoreScientific: ev.scoreScientific,
    scoreQuantity: ev.scoreQuantity,
    scoreBibliography: ev.scoreBibliography,
    justification: ev.justification,
    copyrightStatus: ev.copyrightStatus,
    observations: ev.observations
  };
};

const submitEditEvaluation = async () => {
  if (requiresEditJustification.value && !editForm.value.justification?.trim()) {
    alert('A justificação é obrigatória!');
    return;
  }
  isSubmittingEdit.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/evaluations/${editingEvaluation.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editForm.value)
    });
    if (!res.ok) throw new Error('Erro ao editar');
    editingEvaluation.value = null;
    await fetchMyEvaluations();
  } catch (err) {
    alert(err.message);
  } finally {
    isSubmittingEdit.value = false;
  }
};

const exportZip = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/evaluations/export/zip', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao exportar ZIP');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minhas_avaliacoes.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
};

const downloadPdf = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/evaluations/${id}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao gerar PDF');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avaliacao-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>

<style scoped>
/* ==========================================================================
   Design System & Tokens (Vanilla CSS)
   ========================================================================== */
:root {
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --danger: #ef4444;
  --danger-light: #fef2f2;
  --bg-color: #f8fafc;
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(255, 255, 255, 0.4);
  --text-main: #1e293b;
  --text-muted: #64748b;
  --radius-lg: 16px;
  --radius-sm: 8px;
  --shadow-sm: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.evaluation-container {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
}

.page-header {
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  font-weight: 500;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 1100px;
  flex-wrap: wrap;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-muted);
  transition: var(--transition);
}

.tabs button.active {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.btn-danger {
  background: var(--danger);
  color: white;
}
.btn-danger:hover {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid var(--danger);
}

.glass-panel {
  width: 100%;
  max-width: 800px;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 2.5rem;
  animation: slideUp 0.6s ease-out forwards;
}

.glass-panel-history {
  max-width: 1100px;
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.form-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.form-header p {
  color: var(--text-muted);
}

.form-section {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  transition: var(--transition);
}

.form-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.form-section h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f5f9;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 500;
}

.hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

input[type="text"],
select,
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  font-size: 0.95rem;
  transition: var(--transition);
  color: var(--text-main);
  outline: none;
}

input[type="text"]:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Rating Styles */
.legend {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.criterion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  margin-bottom: 0.8rem;
  transition: var(--transition);
}

.criterion:hover {
  background: #f1f5f9;
}

.rating-group {
  display: flex;
  gap: 0.5rem;
}

.rating-label {
  position: relative;
  cursor: pointer;
}

.rating-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.rating-label span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e2e8f0;
  font-weight: 600;
  color: var(--text-muted);
  transition: var(--transition);
}

.rating-label input:checked ~ span {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.rating-label:hover span {
  border-color: var(--primary);
}

/* Radio Options */
.radio-options {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.radio-options label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-weight: 500;
}

/* Warning Section */
.warning-section {
  background: var(--danger-light);
  border: 1px solid #fecaca;
}

.warning-section h2 {
  color: var(--danger);
  border-bottom-color: #fecaca;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Button */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-submit {
  background: #1e293b;
  color: #ffffff;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 250px;
}

.btn-submit:hover:not(:disabled) {
  background: #0f172a;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loader */
.loader {
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top: 3px solid white;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Responsivo */
@media (max-width: 768px) {
  .evaluation-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tabs button {
    flex: 1;
    text-align: center;
    padding: 0.75rem 0.5rem;
  }

  .criterion {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .rating-label span {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .radio-options {
    flex-direction: column;
    gap: 0.8rem;
  }

  .glass-panel {
    padding: 1.5rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    min-width: 500px;
  }
}

.btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.2rem; transition: transform 0.2s; }
.btn-icon:hover { transform: scale(1.1); }
.text-red { color: #ef4444; }

/* Highly Organized Table Styles */
.table-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  margin-top: 1.5rem;
  border: 1px solid #e2e8f0;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 900px; /* garante espaço para colunas */
}

.styled-table thead tr {
  background-color: #1e293b;
  color: #ffffff;
  text-align: left;
}

.styled-table th,
.styled-table td {
  padding: 1rem 1.2rem;
  vertical-align: middle;
}

.styled-table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #0f172a;
}

.styled-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.styled-table tbody tr:nth-of-type(even) {
  background-color: #f8fafc;
}

.styled-table tbody tr:hover {
  background-color: #f1f5f9;
}

.styled-table tbody tr:last-of-type {
  border-bottom: none;
}

/* Specific Column Styles */
.col-date {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.col-subject strong {
  color: var(--primary);
  font-size: 1.05rem;
}

.col-teacher {
  color: var(--text-main);
  font-weight: 500;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Badges & Buttons */
.badge {
  display: inline-block;
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.btn-action {
  background: white;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-action:hover {
  background: var(--primary);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  border: 2px dashed rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  background: #1e293b;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}
.export-btn:hover {
  background: #0f172a;
  transform: translateY(-2px);
}

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
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}
.evaluation-modal .modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #1e293b;
}
.modal-content label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #475569;
  font-size: 0.9rem;
}
.modal-content input, .modal-content select, .modal-content textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  margin-bottom: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
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
.btn-submit-modal {
  background: #1e293b;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-submit-modal:hover {
  background: #0f172a;
}
.btn-submit-modal:disabled {
  opacity: 0.7;
}
</style>

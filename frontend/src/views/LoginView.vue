<template>
  <div class="login-container">
    <!-- Animated background blobs -->
    <div class="bg-shape shape1"></div>
    <div class="bg-shape shape2"></div>
    <div class="bg-shape shape3"></div>

    <div class="glass-panel login-box">
      <div class="logo-container">
        <img src="/logo-login.png" alt="Logo Avaliação" class="login-logo" />
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>Nome de Utilizador</label>
          <input type="text" v-model="username" required placeholder="eugeniasousa" />
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>
        
        <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>
        
        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="!loading">ENTRAR</span>
          <span v-else class="loader"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async (e) => {
  // Garantir valores se o Autofill do browser não disparar o v-model
  const rawUsername = username.value || e.target.querySelector('input[type="text"]').value;
  const rawPassword = password.value || e.target.querySelector('input[type="password"]').value;

  loading.value = true;
  errorMessage.value = '';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: rawUsername, password: rawPassword })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Falha no login');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data));
    
    if (data.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Animated gradient background */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

/* Floating animated blobs based on ESPE logo colors */
.bg-shape {
  position: absolute;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.5;
  animation: float 10s infinite ease-in-out alternate;
}
.shape1 {
  width: 450px; height: 450px;
  background: #3b82f6; /* Blue */
  top: -100px; left: -100px;
}
.shape2 {
  width: 550px; height: 550px;
  background: #f4b32a; /* ESPE Yellow */
  bottom: -150px; right: -150px;
  animation-delay: -5s;
}
.shape3 {
  width: 350px; height: 350px;
  background: #e52342; /* ESPE Red */
  bottom: 10%; left: 15%;
  animation-duration: 15s;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 60px) scale(1.15); }
}

/* Premium Glassmorphic Box */
.login-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 3rem 2.5rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1);
  text-align: center;
}

/* Logo */
.logo-container {
  margin-bottom: 2.5rem;
}
.login-logo {
  max-width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: contain;
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.1));
  transition: transform 0.5s ease;
}
.login-logo:hover {
  transform: scale(1.02);
}

/* Inputs */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group label {
  color: #334155;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  display: block;
  text-align: left;
  letter-spacing: 0.3px;
}

.input-group input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  outline: none;
  font-size: 1rem;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);
}

.input-group input::placeholder {
  color: #94a3b8;
}

.input-group input:focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), inset 0 2px 4px rgba(0,0,0,0.02);
  transform: translateY(-2px);
}

/* Error */
.error-msg {
  color: #dc2626;
  background: #fee2e2;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: -0.5rem;
}

/* Submit Button */
.btn-submit {
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, #1c4471 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 25px -5px rgba(59, 130, 246, 0.5);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 5px 10px -2px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .login-box {
    padding: 2rem 1.5rem;
    border-radius: 24px;
  }
  .login-logo {
    max-height: 130px;
  }
  .bg-shape {
    opacity: 0.4;
  }
  .shape1 { width: 300px; height: 300px; }
  .shape2 { width: 350px; height: 350px; bottom: -100px; }
  .shape3 { width: 250px; height: 250px; }
}
</style>

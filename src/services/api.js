import axios from 'axios';

// URL base da API: BASE_URL primeiro; API_URL é o que o Terraform/user_data define no EC2.
const apiBaseURL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5003';

// Debug: Log da URL base efetiva
console.log('🔧 API Base URL:', apiBaseURL);

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 180000, // 180 seconds (3 minutes) - allows time for RAG processing with reranking
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach lightweight user info for server-side activity logging when available
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) config.headers['X-User-Id'] = String(user.id);
        if (user?.username) config.headers['X-User-Name'] = String(user.username);
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    try {
      const method = response.config?.method?.toLowerCase();
      // Disparar evento global apenas para chamadas que modificam estado
      if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
        if (typeof window !== 'undefined' && window?.CustomEvent) {
          const ev = new CustomEvent('bovicare:data-changed', { detail: { url: response.config.url, method } });
          window.dispatchEvent(ev);
        }
      }
    } catch (e) {
      // não bloquear resposta em caso de erro no dispatcher
      console.warn('Erro ao disparar evento de atualização:', e);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const onLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login';
    const isLoginCall = url.includes('/users/login');

    if (status === 401 && !isLoginCall && !onLoginPage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Função para registrar um usuário
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao cadastrar usuário');
  }
};

// Função para login de usuário
export const login = async (userData) => {
  try {
    const response = await api.post('/users/login', userData);
    const { token, user } = response.data;
    
    // Salvar token e dados do usuário no localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao realizar login:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Credenciais inválidas');
  }
};

// Função para logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  // Redirecionar para login após logout
  window.location.href = '/login';
};

// Função para iniciar recuperação de senha
export const forgotPassword = async (data) => {
  try {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar código de recuperação:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao enviar código de recuperação');
  }
};

// Função para verificar código de recuperação
export const verifyResetCode = async (data) => {
  try {
    const response = await api.post('/auth/verify-code', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar código:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao verificar código');
  }
};

// Função para redefinir senha
export const resetPassword = async (resetData) => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    console.error('Erro ao redefinir senha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao redefinir senha');
  }
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

// Função para obter dados do usuário atual
export const getCurrentUser = async (userId = null) => {
  try {
    // Se não tiver userId, tentar obter do localStorage
    if (!userId) {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id;
      }
    }
    
    if (!userId) {
      throw new Error('ID do usuário não encontrado');
    }
    
    const response = await api.get(`/api/user/current?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error.response?.data || error.message);
    return null;
  }
};

// Função para atualizar perfil do usuário
export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/api/user/profile', userData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao atualizar perfil');
  }
};

// Função para alterar senha
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/api/user/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar senha:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao alterar senha');
  }
};

// Função para obter dados de bovinos (com filtros opcionais)
export const getCattle = async (filters = {}) => {
  try {
    const params = new URLSearchParams({ per_page: '1000', page: '1' });

    if (filters.herdId) params.append('herd_id', filters.herdId);
    if (filters.status) params.append('status', filters.status);
    if (filters.breed) params.append('breed', filters.breed);

    const query = params.toString();
    const response = await api.get(`/api/v1/animals?${query}`);

    // response.data expected shape: { animals: [...], total, pages }
    if (response.data && Array.isArray(response.data.animals)) {
      return response.data.animals;
    }
    // If the expected shape is not present, throw to signal caller that API did not return animals
    throw new Error('API /api/v1/animals retornou formato inesperado');
  } catch (error) {
    console.error('Erro ao obter dados de bovinos:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter dados de bovinos');
  }
};

const ensureUserId = () => {
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.id || null;
  } catch (err) {
    console.warn('Não foi possível parsear user do localStorage', err);
    return null;
  }
};

// Função para adicionar bovino
export const addCattle = async (cattleData) => {
  try {
    const userId = ensureUserId();
    const payload = {
      earring: cattleData.earring || cattleData.name,
      name: cattleData.name,
      breed: cattleData.breed,
      birth_date: cattleData.birthDate || cattleData.birth_date,
      origin: cattleData.origin,
      gender: cattleData.gender,
      status: cattleData.status || 'ativo',
      mother_id: cattleData.mother_id,
      father_id: cattleData.father_id,
      herd_id: cattleData.herd_id || cattleData.herdId,
      entry_weight: cattleData.entryWeight || cattleData.entry_weight,
      target_weight: cattleData.targetWeight || cattleData.target_weight,
      user_id: cattleData.user_id || userId
    };
    if (!payload.user_id) throw new Error('Usuário não identificado para criação de gado. Faça login novamente.');
    if (!payload.herd_id && Array.isArray(cattleData.herdOptions) && cattleData.herdOptions.length === 1) {
      payload.herd_id = cattleData.herdOptions[0].id;
    }

    const response = await api.post('/api/v1/animals', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar bovino:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao adicionar bovino');
  }
};

// Função para atualizar bovino
export const updateCattle = async (id, cattleData) => {
  try {
    const userId = ensureUserId();
    const payload = {
      earring: cattleData.earring || cattleData.name,
      name: cattleData.name,
      breed: cattleData.breed,
      birth_date: cattleData.birthDate || cattleData.birth_date,
      origin: cattleData.origin,
      gender: cattleData.gender,
      status: cattleData.status || 'ativo',
      mother_id: cattleData.mother_id,
      father_id: cattleData.father_id,
      herd_id: cattleData.herd_id || cattleData.herdId,
      entry_weight: cattleData.entryWeight || cattleData.entry_weight,
      target_weight: cattleData.targetWeight || cattleData.target_weight,
      user_id: cattleData.user_id || userId
    };
    if (!payload.user_id) throw new Error('Usuário não identificado para atualização de gado. Faça login novamente.');

    const response = await api.put(`/api/v1/animals/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar bovino:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao atualizar bovino');
  }
};

// Função para deletar bovino
export const deleteCattle = async (id) => {
  try {
    const userId = ensureUserId();
    const response = await api.delete(`/api/v1/animals/${id}?user_id=${userId || ''}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar bovino:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao deletar bovino');
  }
};

// Função para obter dados do dashboard
export const getDashboardData = async () => {
  try {
    const userId = ensureUserId();
    const url = userId ? `/api/v1/dashboard?user_id=${userId}` : '/api/v1/dashboard';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter dados do dashboard');
  }
};

// Função para obter atividades recentes
export const getRecentActivities = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.username) params.append('username', filters.username);

    const query = params.toString();
    const url = query ? `/api/v1/activities?${query}` : '/api/v1/activities';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter atividades recentes:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter atividades recentes');
  }
};

// Função para obter produção de leite
export const getMilkProduction = async () => {
  try {
    const response = await api.get('/api/milk-production');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter produção de leite:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter produção de leite');
  }
};

// Função para obter estatísticas de saúde
export const getHealthStats = async () => {
  try {
    const response = await api.get('/api/health-stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter estatísticas de saúde:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter estatísticas de saúde');
  }
};

// Função para obter dados completos do perfil
export const getProfileData = async (userId = null) => {
  try {
    // Se não tiver userId, tentar obter do localStorage
    if (!userId) {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id;
      }
    }
    
    if (!userId) {
      throw new Error('ID do usuário não encontrado');
    }
    
    const response = await api.get(`/api/profile?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter dados do perfil:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter dados do perfil');
  }
};

// Função para obter estatísticas do usuário
export const getUserStats = async (userId = null) => {
  try {
    // Se não tiver userId, tentar obter do localStorage
    if (!userId) {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id;
      }
    }
    
    if (!userId) {
      throw new Error('ID do usuário não encontrado');
    }
    
    const response = await api.get(`/api/user/stats?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter estatísticas do usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter estatísticas do usuário');
  }
};

// ===== FUNÇÕES PARA ACOMPANHAMENTO DE PESO =====

// Função para adicionar peso de um gado
export const addWeight = async (weightData) => {
  try {
    const userId = ensureUserId();
    const payload = {
      ...weightData,
      user_id: weightData.user_id || userId
    };
    const response = await api.post('/api/weight', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar peso:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao adicionar peso');
  }
};

// Função para obter histórico de peso
export const getWeightHistory = async (cattleId) => {
  try {
    const userId = ensureUserId();
    const response = await api.get(`/api/weight/${cattleId}?user_id=${userId || ''}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter histórico de peso:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter histórico de peso');
  }
};

// Função para filtrar gados por critérios
export const filterCattle = async (filterCriteria) => {
  try {
    const userId = ensureUserId();
    const payload = {
      ...filterCriteria,
      userId: filterCriteria.userId || userId
    };
    const response = await api.post('/api/cattle/filter', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao filtrar gados:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao filtrar gados');
  }
};

// Função para obter estatísticas de peso
export const getWeightStats = async () => {
  try {
    const response = await api.get('/api/weight/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter estatísticas de peso:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter estatísticas de peso');
  }
};

export const getWeightReport = async () => {
  try {
    const userId = ensureUserId();
    const url = userId ? `/api/weight/report?user_id=${userId}` : '/api/weight/report';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de peso:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao gerar relatório de peso');
  }
};

// Função para obter relatório de desempenho (engorda)
export const getPerformanceReport = async () => {
  try {
    const userId = ensureUserId();
    const url = userId ? `/api/weight/performance-report?user_id=${userId}` : '/api/weight/performance-report';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de desempenho:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao gerar relatório de desempenho');
  }
};

// ===== FUNÇÕES PARA GESTÃO DE REBANHOS/FAZENDAS =====

// Função para obter todos os rebanhos
export const getHerds = async () => {
  try {
    const userId = ensureUserId();
    const url = userId ? `/api/v1/herds?user_id=${userId}` : '/api/v1/herds';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter rebanhos:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter rebanhos');
  }
};

// Função para criar novo rebanho/fazenda
export const createHerd = async (herdData) => {
  try {
    const payload = { ...herdData };
    const response = await api.post('/api/v1/herds', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar rebanho:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao criar rebanho');
  }
};

// Função para obter rebanho por ID
export const getHerd = async (herdId) => {
  try {
    const response = await api.get(`/api/v1/herds/${herdId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter rebanho:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter rebanho');
  }
};

// Função para atualizar rebanho
export const updateHerd = async (herdId, herdData) => {
  try {
    const response = await api.put(`/api/v1/herds/${herdId}`, herdData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar rebanho:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao atualizar rebanho');
  }
};

// Função para deletar rebanho
export const deleteHerd = async (herdId) => {
  try {
    const response = await api.delete(`/api/v1/herds/${herdId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar rebanho:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao deletar rebanho');
  }
};

// Função para upload de documentos de fazenda
export const uploadHerdDocuments = async (herdId, formData) => {
  try {
    const response = await api.post(`/api/v1/herds/${herdId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload de documentos:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao fazer upload de documentos');
  }
};

// Função para atualizar foto do perfil
export const updateProfilePhoto = async (formData) => {
  try {
    console.log('📤 Enviando foto para:', 'http://localhost:5003/api/profile/photo');
    console.log('📤 FormData:', formData);
    
    const response = await api.post('/api/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Resposta do backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    console.error('❌ Response:', error.response?.data);
    console.error('❌ Status:', error.response?.status);
    throw new Error(error.response?.data?.message || 'Erro ao atualizar foto do perfil');
  }
};

// ===== FUNÇÕES PARA GERENCIAMENTO DE USUÁRIOS (ADMIN) =====

// Função para obter lista de usuários (apenas para admins)
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter usuários:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter usuários');
  }
};

// Função para criar novo usuário (apenas para admins)
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao criar usuário');
  }
};

// Função para atualizar usuário (apenas para admins)
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao atualizar usuário');
  }
};

// Função para excluir usuário (apenas para admins)
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao excluir usuário');
  }
};

// Função para obter usuário por ID (apenas para admins)
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter usuário:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao obter usuário');
  }
};

// ===== CHAT / CONVERSATION API (backend memory) =====

export const getConversations = async () => {
  try {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  } catch (error) {
    console.error('Erro ao listar conversas:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao listar conversas');
  }
};

export const createConversation = async (title = 'Nova conversa') => {
  try {
    const response = await api.post('/api/chat/conversations', { title });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar conversa:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao criar conversa');
  }
};

export const getConversationMessages = async (conversationId) => {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao carregar mensagens');
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    await api.delete(`/api/chat/conversations/${conversationId}`);
  } catch (error) {
    console.error('Erro ao excluir conversa:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Erro ao excluir conversa');
  }
};

export const sendChatMessage = async (query, conversationId = null) => {
  try {
    const payload = { query };
    if (conversationId) payload.conversation_id = conversationId;
    const response = await api.post('/api/chat/diagnose', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
};

// Exportar a instância do axios para uso direto se necessário
export default api;

import axios from 'axios';

// Configurar a URL base da API
const api = axios.create({
  baseURL: 'http://localhost:4000', // ou o endereço da sua API
});

// Função para registrar um usuário
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData); // Altere a URL conforme necessário
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error.response ? error.response.data : error.message);
    throw new Error('Erro ao cadastrar usuário: ' + (error.response ? error.response.data.message : error.message));
  }
};

// Função para login de usuário
export const loginUser = async (userData) => {
  try {
    const response = await api.post('/users/login', userData); // Altere a URL conforme necessário
    return response.data;
  } catch (error) {
    console.error('Erro ao realizar login:', error.response ? error.response.data : error.message);
    throw new Error('Erro ao realizar login: ' + (error.response ? error.response.data.message : error.message));
  }
};

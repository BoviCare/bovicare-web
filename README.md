# BoviCare - Sistema de Gerenciamento de Bovinos

![BoviCare Logo](public/logo.svg)

BoviCare é um sistema web completo para gerenciamento de informações relacionadas ao cuidado de bovinos, desenvolvido com ReactJS no frontend e Python no backend.

## 📋 Status do Projeto

### Últimas Atualizações (Semana Atual)
- ✅ **API de Recuperação de Login/Senha**: Implementadas correções para maior robustez no backend
- ✅ **Estabilidade do Sistema**: Código compila e executa sem erros
- ✅ **Frontend React**: Interface responsiva com Tailwind CSS
- 🔄 **Integração Backend-Frontend**: Em desenvolvimento ativo
- 📋 **Testes Automatizados**: Planejados para próxima iteração

### Próximos Passos
- [ ] Implementar testes automatizados para validação das correções
- [ ] Consolidar integração entre backend e frontend
- [ ] Preparar versão mínima utilizável (MVP)
- [ ] Melhorar cobertura de testes e validações de fluxo completo

## 🚀 Deployment

Este repositório é um **consumer** da infra do repositório **`aws_infrastructure`** (producer). Contrato completo: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Resumo: ECR `bovicare-web`, serviço `frontend` no `docker-compose` da EC2; secrets listados em `docs/DEPLOYMENT.md`.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **ReactJS** - Biblioteca para interface de usuário
- **Tailwind CSS** - Framework CSS para estilização responsiva
- **React Router DOM** - Roteamento de páginas
- **Axios** - Cliente HTTP para comunicação com API
- **React Icons** - Biblioteca de ícones
- **Leaflet** - Mapas interativos

### Backend
- **Python** - Linguagem de programação
- **API REST** - Arquitetura de comunicação
- **Sistema de Autenticação** - Login e recuperação de senha

### DevOps
- **Docker** - Containerização
- **Git** - Controle de versão
- **GitHub** - Repositório remoto

## 🚀 Funcionalidades

### ✅ Implementadas
- **Interface Responsiva** - Design moderno com Tailwind CSS
- **Sistema de Autenticação** - Login e recuperação de senha
- **Navegação** - Roteamento entre páginas
- **Componentes Reutilizáveis** - Header, Navbar, SearchBar

### 🔄 Em Desenvolvimento
- **Gerenciamento de Bovinos** - CRUD completo
- **Registro de Saúde** - Dados veterinários
- **Acompanhamento de Peso** - Histórico de crescimento
- **Mapas Interativos** - Localização do gado
- **Chatbot com IA** - Assistente inteligente

### 📋 Planejadas
- **Relatórios** - Análise de produtividade
- **Notificações** - Alertas de saúde
- **Integração IoT** - Sensores de monitoramento

## 🧪 Testes e Qualidade

### Status Atual dos Testes
- **Frontend**: Testes básicos configurados com Jest e React Testing Library
- **Backend**: Testes de API em desenvolvimento
- **Integração**: Testes end-to-end planejados

### Executar Testes
```bash
# Testes do frontend
npm test

# Testes com cobertura
npm run test:coverage

# Testes e2e (planejado)
npm run test:e2e
```

## 📋 Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:

- [**Git**](https://git-scm.com) - Controle de versão
- [**Node.js**](https://nodejs.org) (v16+) - Runtime JavaScript
- [**Docker**](https://www.docker.com) - Containerização
- [**Docker Compose**](https://docs.docker.com/compose/) - Orquestração de containers

## 🚀 Como Executar o Projeto

### Desenvolvimento Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/BoviCare/bovicare-web.git
   cd bovicare-web
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Execute o projeto**
   ```bash
   # Desenvolvimento
   npm start
   
   # Build para produção
   npm run build
   ```

5. **Acesse a aplicação**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000 (quando disponível)

### Docker

```bash
# Build da imagem
docker build -t bovicare-web .

# Executar container
docker run -p 3000:3000 bovicare-web
```

## 📁 Estrutura do Projeto

```
bovicare-web/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── auth/           # Autenticação (login, register, forgot)
│   │   ├── Header/         # Cabeçalho da aplicação
│   │   ├── Navbar/          # Navegação principal
│   │   └── SearchBar/       # Barra de pesquisa
│   ├── pages/              # Páginas da aplicação
│   │   ├── Home/           # Página inicial
│   │   ├── Profile/        # Perfil do usuário
│   │   └── Settings/       # Configurações
│   ├── services/           # Serviços e APIs
│   │   ├── api.js          # Configuração da API
│   │   └── validation.js   # Validações
│   ├── routes/             # Configuração de rotas
│   └── App.js              # Componente principal
├── public/                 # Arquivos estáticos
├── Dockerfile             # Configuração Docker
├── package.json           # Dependências e scripts
└── README.md              # Documentação
```

## 📝 Padrões de Commit

Seguimos o padrão de commits semânticos para melhor rastreabilidade:

```bash
# Tipos de commit
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
style:    formatação
refactor: refatoração
test:     testes
chore:    manutenção

# Exemplos
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve login API integration issue"
git commit -m "docs: update README with latest changes"
```

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

- **Repositório**: [BoviCare/bovicare-web](https://github.com/BoviCare/bovicare-web)
- **Issues**: [GitHub Issues](https://github.com/BoviCare/bovicare-web/issues)

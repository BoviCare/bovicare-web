<!DOCTYPE html>
<html lang="pt-BR">
<head>

</head>
<body>
    <h1>Bovicare - Frontend </h1> 
    <img src="public/logo.svg" width=100px>
    <p>Bovicare é um sistema web cujo frontend é desenvolvido com ReactJS. O objetivo do Bovicare é fornecer uma plataforma robusta e escalável para o gerenciamento de informações relacionadas ao cuidado de bovinos.</p>

  <h2>Tecnologias Utilizadas</h2>
    <ul>
        <li><img src="https://img.icons8.com/color/48/000000/react-native.png" alt="ReactJS logo"><strong>Frontend:</strong> ReactJS</li>
        <li><img src="https://img.icons8.com/color/48/000000/docker.png" alt="Docker logo"><strong>Containerização:</strong> Docker</li>
    </ul>

  <h2>Funcionalidades</h2>
    <ul>
        <li>Interface amigável e responsiva</li>
        <li>Gerenciamento de informações de bovinos</li>
        <li>Registro de dados de saúde e alimentação</li>
        <li>Acompanhamento de crescimento e produtividade</li>
    </ul>

  <h2>Pré-requisitos</h2>
    <p>Antes de começar, você vai precisar ter instalado em sua máquina as seguintes ferramentas:</p>
    <ul>
        <li><a href="https://git-scm.com">Git</a></li>
        <li><a href="https://www.docker.com">Docker</a></li>
        <li><a href="https://docs.docker.com/compose/">Docker Compose</a></li>
        <li><a href="https://nodejs.org">Node.js</a></li>
    </ul>

  <h2>Como rodar o projeto</h2>
    <p>Siga os passos abaixo para configurar e executar o frontend do projeto em seu ambiente de desenvolvimento:</p>
    <ol>
        <li>
            <p><strong>Clone o repositório</strong></p>
            <pre><code>git clone https://github.com/seu-usuario/bovicare.git</code></pre>
        </li>
        <li>
            <p><strong>Navegue até o diretório do frontend</strong></p>
            <pre><code>cd bovicare/frontend</code></pre>
        </li>
        <li>
            <p><strong>Instale as dependências do frontend</strong></p>
            <pre><code>npm install</code></pre>
        </li>
        <li>
            <p><strong>Inicie o frontend</strong></p>
            <pre><code>npm start</code></pre>
        </li>
        <li>
            <p><strong>Acesse a aplicação</strong></p>
            <p>O frontend estará disponível em <code>http://localhost:3000</code>.</p>
        </li>
    </ol>

  <h2>Estrutura do Projeto</h2>
    <pre><code>
frontend/
│
├── src/
│   ├── components/
│   │   ├── Component1.js
│   │   ├── Component2.js
│   │   └── ...
|   ├── pages/
│   │   ├── page1.js
│   │   ├── page2.js
│   │   └── ...
│   ├── App.js
│   ├── index.js
│   └── ...
├── Dockerfile
├── package.json
└── README.md
    </code></pre>

  <h2>Licença</h2>
    <p>Este projeto está licenciado sob a licença MIT. Veja o arquivo <a href="LICENSE">LICENSE</a> para mais detalhes.</p>
</body>
</html>

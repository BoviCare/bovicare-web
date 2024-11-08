# Use a imagem base do Node.js
FROM node:18

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json para o diretório de trabalho
COPY package.json package-lock.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Defina o comando para iniciar a aplicação
CMD ["npm", "start"]

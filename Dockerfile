FROM node:20-alpine

WORKDIR /app

# Copiamos las dependencias primero para aprovechar el caché
COPY package*.json ./
RUN npm install

# Copiamos todo el resto del proyecto
COPY . .

# Puerto en el que corre Express
EXPOSE 3000

# Comando para iniciar el servidor (según tu estructura está en server/app.js)
CMD ["node", "server/app.js"]
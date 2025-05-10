FROM node:18
WORKDIR /app
COPY package*.jason ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "index"]
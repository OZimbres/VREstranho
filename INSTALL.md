# 🚀 VR Estranho - Guia de Instalação Rápida

## Hackathon VR - Solução de Gerenciamento Remoto de PDVs

### Pré-requisitos
- Node.js 18+
- Docker (opcional)
- Git

### 🏃‍♂️ Instalação Rápida com Docker

1. **Clone o repositório**
```bash
git clone https://github.com/OZimbres/VREstranho.git
cd VREstranho
```

2. **Execute com Docker Compose**
```bash
docker-compose up -d
```

3. **Acesse a aplicação**
- Portal: http://localhost:4200
- API: http://localhost:3000
- Login: admin / admin123

### 🛠️ Instalação Manual

#### 1. Backend API
```bash
cd portal-backend
npm install
npm start
```

#### 2. Frontend Portal
```bash
cd portal-frontend
npm install
ng serve
```

#### 3. Agent PDV
```bash
cd agent
npm install
npm start
```

### 📱 Primeiro Acesso

1. Acesse http://localhost:4200
2. Login: `admin` / Senha: `admin123`
3. Dashboard mostrará agentes conectados
4. Execute o agent em uma máquina PDV para teste

### 🎯 Funcionalidades Prontas

- ✅ Dashboard com métricas
- ✅ Gerenciamento de agentes
- ✅ Navegação de arquivos remotos
- ✅ Execução de comandos
- ✅ Comunicação real-time
- ✅ Sistema de autenticação

### 🔧 Configuração Agent

No PDV, configure a URL do servidor:
```bash
export SERVER_URL=ws://seu-servidor:3000
npm start
```

### 📊 Demo

A aplicação inclui dados de demonstração:
- 3 agentes PDV simulados
- Operações de exemplo
- Estrutura de arquivos mock

### 🏆 Hackathon Ready!

Solução completa implementada atendendo todos os requisitos:
- Portal Angular ✅
- Backend Node.js ✅  
- Agent cross-platform ✅
- Docker configuration ✅
- Documentação completa ✅
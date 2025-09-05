# VR Estranho - Remote PDV Management Tool

## 🎯 Hackathon VR - Solução de Gerenciamento Remoto de PDVs

Uma ferramenta completa para atualização e gerenciamento remoto de ambientes PDV, desenvolvida para o Hackathon VR 2024.

### 📋 Visão Geral

**VR Estranho** é uma solução que permite a gestão remota de estações PDV através de um portal web intuitivo e agentes leves instalados nas máquinas cliente.

### 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Portal Web     │    │   Backend API   │    │  Agent (PDV)    │
│  (Angular)      │◄──►│  (Java Spring)  │◄──►│ (Cross-platform)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 Componentes

#### Portal (Web Interface)
- **Frontend**: Angular com interface responsiva
- **Backend**: Java Spring Boot com API RESTful e WebSocket
- **Database**: SQLite para simplicidade (pode ser escalado)
- **Docker**: Containerização completa

#### Agent (Cliente PDV)
- **Plataformas**: Windows e Linux
- **Características**: Baixo consumo de recursos
- **Funcionalidades**: 
  - Instalação de aplicações
  - Modificação de arquivos/DLLs
  - Comunicação segura com portal

### ⚡ Funcionalidades Principais

- ✅ Gerenciamento remoto de arquivos
- ✅ Instalação de aplicações
- ✅ Edição de arquivos de configuração
- ✅ Monitoramento em tempo real
- ✅ Interface agnóstica ao produto PDV
- ✅ Comunicação segura

### 🚀 Início Rápido

#### Pré-requisitos
- Node.js 20+
- npm 9+

#### Instalação Automática
```bash
git clone https://github.com/OZimbres/VREstranho.git
cd VREstranho
./setup.sh
```

#### Instalação Manual
1. **Clone o repositório**
```bash
git clone https://github.com/OZimbres/VREstranho.git
cd VREstranho
```

2. **Configure o backend**
```bash
cd portal-backend
npm install
npm run dev
```

3. **Configure o frontend (nova janela)**
```bash
cd portal-frontend
npm install
npm start
```

4. **Configure o agent (nova janela)**
```bash
cd agent
npm install
npm start
```

#### 🌐 Acessos
- **Portal Web**: http://localhost:4200
- **API Backend**: http://localhost:3000
- **Login**: admin / admin123

#### 🐳 Docker (Alternativo)
```bash
docker compose up -d
```
*Nota: Docker funciona para frontend, backend local recomendado para desenvolvimento*

### 📊 Critérios de Avaliação

- **Inovação (20%)**: Interface intuitiva e arquitetura moderna
- **Viabilidade técnica (70%)**: Solução completa e funcional
- **Apresentação (10%)**: Documentação clara e demonstração efetiva

### 📁 Estrutura do Projeto

```
VREstranho/
├── portal-frontend/     # Angular frontend
├── portal-backend/      # Node.js backend
├── agent/              # Cross-platform agent
├── docs/               # Documentação
├── docker-compose.yml  # Configuração Docker
└── README.md          # Este arquivo
```

### 🔒 Segurança

- Autenticação JWT
- Comunicação HTTPS
- Validação de integridade de arquivos
- Controle de permissões

### 📈 Roadmap

- [x] Estrutura base do projeto
- [x] Portal frontend (Angular)
- [x] API backend (Node.js) 
- [x] Agent cross-platform
- [x] Sistema de autenticação
- [x] Interface de gerenciamento de arquivos
- [x] Comunicação WebSocket real-time
- [x] Deploy com Docker
- [x] Documentação completa
- [x] Testes e validação

### 🏆 Equipe

Desenvolvido com ❤️ para o Hackathon VR 2024

---
**VR Estranho - Controlando a realidade dos PDVs remotamente**

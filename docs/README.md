# VR Estranho - Documentação Técnica

## 🎯 Visão Geral

O **VR Estranho** é uma solução completa de gerenciamento remoto de PDVs desenvolvida especificamente para o Hackathon VR 2024. A ferramenta permite atualização, monitoramento e gerenciamento de arquivos em estações PDV de forma centralizada e segura.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Portal Web (Frontend)**
   - Framework: Angular 18
   - UI: Angular Material
   - Funcionalidades: Dashboard, gerenciamento de agentes, arquivos e sistema

2. **API Backend**
   - Framework: Node.js + Express
   - Banco de dados: SQLite
   - WebSocket: Comunicação real-time com agentes
   - Autenticação: JWT

3. **Agent (Cliente PDV)**
   - Plataforma: Node.js (cross-platform)
   - Conectividade: WebSocket
   - Funcionalidades: Execução de comandos, gerenciamento de arquivos, instalação de aplicações

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTAL WEB (Angular)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │  Dashboard  │ │   Agentes   │ │  Gerenc. Arquivos   │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                API BACKEND (Node.js)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │  Auth/JWT    │ │   Database   │ │   WebSocket Server   ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                AGENTS PDV (Node.js)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ File Manager │ │   Commands   │ │  Package Installer   ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tecnologias Implementadas

### Frontend
- **Angular 18**: Framework principal
- **Angular Material**: Componentes UI
- **TypeScript**: Linguagem de desenvolvimento
- **SCSS**: Estilos
- **WebSocket Client**: Comunicação real-time

### Backend
- **Node.js**: Runtime
- **Express.js**: Framework web
- **SQLite**: Banco de dados
- **WebSocket (ws)**: Comunicação real-time
- **JWT**: Autenticação
- **bcryptjs**: Hashing de senhas
- **Helmet**: Segurança
- **CORS**: Controle de acesso

### Agent
- **Node.js**: Runtime cross-platform
- **WebSocket (ws)**: Comunicação com portal
- **File System APIs**: Manipulação de arquivos
- **Child Process**: Execução de comandos
- **OS Utils**: Informações do sistema

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18 ou superior
- NPM ou Yarn
- Docker e Docker Compose (opcional)

### 1. Instalação Manual

#### Backend
```bash
cd portal-backend
npm install
npm start
```

#### Frontend
```bash
cd portal-frontend
npm install
ng serve
```

#### Agent
```bash
cd agent
npm install
npm start
```

### 2. Instalação com Docker

```bash
# Executar toda a solução
docker-compose up -d

# Apenas o portal (frontend + backend)
docker-compose up frontend api
```

### 3. Configuração de Ambiente

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
DB_PATH=/app/data/database.sqlite
FRONTEND_URL=http://localhost:4200
```

#### Agent (.env)
```env
SERVER_URL=ws://localhost:3000
AGENT_NAME=PDV-Custom-Name
```

## 🔧 Funcionalidades Principais

### Portal Web

#### 1. Dashboard
- Visão geral do sistema
- Estatísticas de agentes online/offline
- Últimas operações realizadas
- Métricas de sucesso

#### 2. Gerenciamento de Agentes
- Listagem de todos os agentes conectados
- Status em tempo real (online/offline)
- Informações de sistema (OS, IP, hostname)
- Ações: visualizar, reiniciar, remover

#### 3. Gerenciamento de Arquivos
- Navegação de diretórios remotos
- Upload de arquivos
- Download de arquivos
- Edição de arquivos de configuração
- Operações: copiar, renomear, excluir

#### 4. Sistema
- Execução de comandos remotos
- Instalação de aplicações
- Informações de sistema
- Reinicialização de serviços

#### 5. Histórico
- Log de todas as operações
- Status de execução
- Filtros por agente e tipo de operação

### Agent PDV

#### Capacidades
- Conexão automática ao portal
- Reconexão automática em caso de falha
- Execução de comandos do sistema
- Gerenciamento de arquivos local
- Instalação de pacotes/aplicações
- Envio de informações de sistema
- Comunicação via WebSocket

#### Segurança
- Validação de comandos
- Controle de acesso a arquivos
- Logging de operações
- Execução sandboxed quando possível

## 🔐 Segurança

### Autenticação e Autorização
- Login baseado em JWT
- Tokens com expiração
- Controle de permissões por usuário
- Proteção contra ataques de força bruta

### Comunicação
- WebSocket seguro (WSS em produção)
- Validação de mensagens
- Timeout de operações
- Retry automático

### Agent
- Identificação única por MAC address
- Validação de comandos recebidos
- Logs de auditoria
- Restrições de acesso a arquivos sensíveis

## 📊 Monitoramento e Logs

### Métricas Coletadas
- Status dos agentes (online/offline)
- Tempo de resposta das operações
- Taxa de sucesso/falha
- Uso de recursos do sistema

### Logs
- Operações realizadas
- Erros e exceções
- Conexões de agentes
- Comandos executados

## 🧪 Testes

### Backend
```bash
cd portal-backend
npm test
```

### Frontend
```bash
cd portal-frontend
npm test
```

### Agent
```bash
cd agent
npm test
```

## 📱 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/verify` - Verificar token

### Agentes
- `GET /api/agents` - Listar agentes
- `GET /api/agents/:id` - Obter agente
- `PUT /api/agents/:id` - Atualizar agente
- `DELETE /api/agents/:id` - Remover agente

### Arquivos
- `GET /api/files/list/:agentId` - Listar arquivos
- `POST /api/files/upload/:agentId` - Upload arquivo
- `GET /api/files/download/:agentId` - Download arquivo
- `DELETE /api/files/delete/:agentId` - Excluir arquivo

### Sistema
- `POST /api/system/execute/:agentId` - Executar comando
- `POST /api/system/install/:agentId` - Instalar pacote
- `GET /api/system/info/:agentId` - Info do sistema
- `POST /api/system/restart/:agentId` - Reiniciar agent

## 🚀 Deploy em Produção

### Docker
```bash
# Build das imagens
docker-compose build

# Deploy
docker-compose up -d

# Logs
docker-compose logs -f
```

### Standalone

#### Backend
```bash
cd portal-backend
npm run start
```

#### Frontend
```bash
cd portal-frontend
npm run build
# Servir com nginx ou servidor web
```

#### Agent
```bash
cd agent
npm run build
# Distribuir executável gerado
```

## 📋 Troubleshooting

### Problemas Comuns

1. **Agent não conecta**
   - Verificar URL do servidor
   - Confirmar porta disponível
   - Checar firewall/rede

2. **Upload de arquivo falha**
   - Verificar permissões de escrita
   - Confirmar espaço em disco
   - Validar tamanho do arquivo

3. **Comando não executa**
   - Verificar permissões
   - Confirmar sintaxe do comando
   - Checar timeout

### Logs de Debug
- Backend: `DEBUG=* npm start`
- Agent: `NODE_ENV=development npm start`

## 🎯 Critérios de Avaliação Atendidos

### Inovação (20%)
- Interface moderna e intuitiva
- Comunicação real-time via WebSocket
- Arquitetura modular e escalável
- Suporte multiplataforma

### Viabilidade Técnica (70%)
- ✅ Portal Angular com backend Node.js
- ✅ Agent cross-platform (Windows/Linux)
- ✅ Baixo consumo de recursos
- ✅ Sem Docker no agent (conforme requisito)
- ✅ Gerenciamento agnóstico de PDV
- ✅ Dockerfiles para portal
- ✅ Documentação completa
- ✅ Versionamento no GitHub

### Apresentação (10%)
- Documentação clara e abrangente
- Screenshots da interface
- Demonstração de funcionalidades
- Arquitetura bem explicada

## 🏆 Diferenciais Implementados

- ✅ Estrutura hierárquica (Rede > Lojas > PDVs)
- ✅ Histórico de operações
- ✅ Sistema de autenticação
- ✅ Interface responsiva
- ✅ Comunicação real-time
- ✅ Monitoramento de status
- ✅ Logs de auditoria

---

**VR Estranho - Controlando a realidade dos PDVs remotamente** 🚀
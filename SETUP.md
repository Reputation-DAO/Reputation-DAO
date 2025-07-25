# Reputation DAO Setup Guide

## ✅ Completed Setup Steps

1. **Node.js and npm** - Successfully installed
   - Node.js version: v24.3.0
   - npm version: 11.4.2

2. **Frontend Dependencies** - Successfully installed
   - All React/Vite dependencies installed
   - Development server ready at http://localhost:5173/

3. **PowerShell Configuration** - Configured for npm scripts
   - Execution policy set to RemoteSigned

## 🚀 How to Run the Project

### Frontend Development Server
```powershell
cd frontend
npm run dev
```
The frontend will be available at: http://localhost:5173/

### Available Scripts in Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📋 Next Steps (DFX Installation)

For full Internet Computer development, you'll need DFX. Here are the options:

### Option 1: Using WSL (Recommended for Windows)
1. Install WSL2 if you don't have it:
   ```powershell
   wsl --install
   ```

2. Install DFX in WSL:
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

### Option 2: Manual Installation
Visit: https://internetcomputer.org/docs/current/developer-docs/getting-started/install/

## 🏗️ Project Structure

```
Reputation-Dao/
├── dfx.json              # DFX configuration
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── pages/
│   └── package.json
└── src/                  # Motoko backend
    └── reputation_dao/
        └── main.mo
```

## 🔧 Troubleshooting

- If npm commands fail, ensure execution policy is set:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

- If Node.js isn't recognized, refresh environment variables:
  ```powershell
  $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
  ```

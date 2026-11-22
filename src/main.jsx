import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/chakra-petch/600.css'
import './styles/theme.css'
import './styles/global.css'
import './styles/desktop.css'
import App from './App.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'

// Ponto de partida: coloca o App dentro da página e liga a navegação entre telas
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

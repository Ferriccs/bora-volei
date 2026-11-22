import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import BarraTitulo from '../components/BarraTitulo.jsx'
import CaixaAzul from '../components/CaixaAzul.jsx'
import Botao from '../components/Botao.jsx'
import CampoTexto from '../components/CampoTexto.jsx'
import Opcoes from '../components/Opcoes.jsx'
import Pilula from '../components/Pilula.jsx'
import Estrelas from '../components/Estrelas.jsx'
import { supabaseConfigurado } from '../lib/supabase.js'

// Página de amostra da etapa 1: mostra todas as peças do visual juntas,
// para conferir cores, fonte e formatos antes de montar as telas de verdade.
const NIVEIS = [
  { valor: 'basico', rotulo: 'Básico' },
  { valor: 'intermediario', rotulo: 'Intermediário' },
  { valor: 'avancado', rotulo: 'Avançado' },
]
const POSICOES = [
  { valor: 'levantador', rotulo: 'Levantador' },
  { valor: 'ponteiro', rotulo: 'Ponteiro' },
  { valor: 'central', rotulo: 'Central' },
  { valor: 'oposto', rotulo: 'Oposto' },
  { valor: 'libero', rotulo: 'Líbero' },
]
const INTEGRANTES = ['Luis', 'Tristan', 'Escote', 'Gragas', 'Jupiter']

export default function Amostra() {
  const [nivel, setNivel] = useState('intermediario')
  const [posicoes, setPosicoes] = useState(['central'])
  const [notas, setNotas] = useState({})

  return (
    <main className="tela">
      <div className="centro"><Logo tipo="vertical" largura={240} /></div>

      <BarraTitulo grande as="h1">Amostra visual</BarraTitulo>

      <p style={{ textAlign: 'center', fontSize: 15 }}>
        Supabase: {supabaseConfigurado ? 'conectado ✔' : 'ainda sem chaves (normal na etapa 1)'}
      </p>

      {/* Formulário, como no Login */}
      <CaixaAzul>
        <CampoTexto rotulo="E-mail" type="email" placeholder="voce@email.com" autoComplete="email" />
        <CampoTexto rotulo="Senha" type="password" placeholder="••••••" autoComplete="current-password" />
        <Link to="/esqueci-senha" style={{ color: 'var(--branco)', textAlign: 'center', fontSize: 14 }}>
          Esqueci minha senha
        </Link>
      </CaixaAzul>
      <div className="centro"><Botao>Entrar</Botao></div>

      {/* Opções, como no Primeiro acesso */}
      <section className="secao">
        <BarraTitulo>Qual seu nível de vôlei?</BarraTitulo>
        <Opcoes nome="nivel" opcoes={NIVEIS} valor={nivel} onChange={setNivel} />
      </section>
      <section className="secao">
        <BarraTitulo>Posições secundárias</BarraTitulo>
        <Opcoes nome="posicoes" opcoes={POSICOES} valor={posicoes} onChange={setPosicoes} multiplo />
      </section>

      {/* Caixa com título encaixado, como em Integrantes */}
      <CaixaAzul titulo="Integrantes">
        <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', lineHeight: 1.5 }}>
            {INTEGRANTES.map((n) => <li key={n}>{n.toUpperCase()}</li>)}
          </ul>
          <Botao variante="claro">Sortear times</Botao>
        </div>
      </CaixaAzul>

      {/* Avaliação anônima com estrelas */}
      <CaixaAzul titulo="Avaliação (anônimo)">
        {INTEGRANTES.map((n) => (
          <div key={n} className="linha" style={{ justifyContent: 'space-between' }}>
            <span>{n.toUpperCase()}</span>
            <Estrelas
              rotulo={`Nota de ${n}`}
              valor={notas[n] || 0}
              onChange={(v) => setNotas({ ...notas, [n]: v })}
            />
          </div>
        ))}
      </CaixaAzul>

      {/* Pílulas, como no Perfil */}
      <section className="secao">
        <BarraTitulo>Perfil: Lebron James · 9,8</BarraTitulo>
        <div className="linha" style={{ justifyContent: 'center' }}>
          <Pilula>Experiente</Pilula>
          <Pilula>25 anos</Pilula>
          <Pilula>Imperatriz - MA</Pilula>
          <Pilula destaque>Ponteiro</Pilula>
          <Pilula>Central</Pilula>
        </div>
      </section>

      {/* Times, como no Resultado do sorteio */}
      <div className="linha" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
        {[['Time A', ['Luis', 'Tristan', 'Escote'], '7,2'], ['Time B', ['Gragas', 'Jupiter', 'Samuel'], '7,7']].map(
          ([nome, jogadores, media]) => (
            <div key={nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CaixaAzul>
                <div className="centro"><Botao variante="claro" tabIndex={-1}>{nome}</Botao></div>
                {jogadores.map((j) => <span key={j}>{j.toUpperCase()}</span>)}
              </CaixaAzul>
              <Pilula>Média: {media}</Pilula>
            </div>
          )
        )}
      </div>

      <div className="centro" style={{ paddingTop: 8 }}>
        <Logo tipo="horizontal" largura={200} />
      </div>
    </main>
  )
}

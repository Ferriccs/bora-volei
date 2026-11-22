import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { traduzirErro } from '../auth/mensagens.js'
import CaixaAzul from '../../components/CaixaAzul.jsx'
import Estrelas from '../../components/Estrelas.jsx'
import Aviso from '../../components/Aviso.jsx'
import './avaliacoes.css'

// Caixa "Avaliação (anônimo)" da tela do grupo (tela 09 do Figma).
// Cada um dá de 1 a 5 estrelas para os outros integrantes. Votar de novo troca o voto.
// Só você vê as estrelas que você deu; para os outros só aparece a nota final no perfil.
export default function AvaliacaoGrupo({ grupoId, integrantes, meuId }) {
  const [meusVotos, setMeusVotos] = useState({})
  const [salvo, setSalvo] = useState('')
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    supabase.rpc('minhas_avaliacoes_gerais', { p_grupo: grupoId }).then(({ data, error }) => {
      if (error) return setErro(traduzirErro(error))
      setMeusVotos(Object.fromEntries(data.map((v) => [v.avaliado, v.estrelas])))
    })
  }, [grupoId])

  async function votar(userId, nome, estrelas) {
    setErro(''); setSalvo('')
    const antes = meusVotos[userId]
    setMeusVotos({ ...meusVotos, [userId]: estrelas })
    const { error } = await supabase.rpc('avaliar_geral', { p_grupo: grupoId, p_avaliado: userId, p_estrelas: estrelas })
    if (error) {
      setMeusVotos({ ...meusVotos, [userId]: antes })
      return setErro(traduzirErro(error))
    }
    setSalvo(`Avaliação de ${nome} salva.`)
  }

  const outros = integrantes.filter((i) => i.user_id !== meuId)
  const avaliados = outros.filter((i) => meusVotos[i.user_id]).length
  const lista = aberta ? outros : outros.slice(0, 5)

  return (
    <CaixaAzul titulo="Avaliação (anônimo)">
      {outros.length === 0 && <p>Quando entrar mais gente no grupo, você poderá avaliar aqui.</p>}
      {outros.length > 0 && <p className="avaliacao__dica">Ninguém vai saber quem deu cada nota. Você avaliou {avaliados} de {outros.length}.</p>}
      {lista.map((i) => (
        <div key={i.user_id} className="avaliacao__linha">
          <Link to={`/perfil/${i.user_id}`} className="link-nome avaliacao__nome">{i.perfil?.nome}</Link>
          <Estrelas valor={meusVotos[i.user_id] || 0} rotulo={`Estrelas para ${i.perfil?.nome}`}
            onChange={(n) => votar(i.user_id, i.perfil?.nome, n)} />
        </div>
      ))}
      {outros.length > 5 && (
        <button type="button" className="link-claro" onClick={() => setAberta(!aberta)}>
          {aberta ? 'Mostrar menos' : `Mostrar todos (${outros.length})`}
        </button>
      )}
      <Aviso>{erro}</Aviso>
      <Aviso tipo="sucesso">{salvo}</Aviso>
    </CaixaAzul>
  )
}

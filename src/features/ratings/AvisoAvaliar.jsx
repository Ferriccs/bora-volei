import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import './avaliacoes.css'

const DIA = (iso) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '')

// Aviso amarelo "Como foi o jogo de terça?" para quem jogou e ainda não avaliou.
// Fica aberto por 3 dias depois do encontro. "grupoId" filtra só um grupo (na tela do grupo).
export default function AvisoAvaliar({ grupoId }) {
  const [lista, setLista] = useState([])

  useEffect(() => {
    supabase.rpc('encontros_para_avaliar').then(({ data }) => setLista(data || []))
  }, [])

  const visiveis = grupoId ? lista.filter((e) => e.group_id === grupoId) : lista
  if (!visiveis.length) return null

  return visiveis.map((e) => (
    <Link key={e.meeting_id} to={`/encontros/${e.meeting_id}/avaliar`} className="aviso-avaliar">
      <div>
        <strong>Como foi o jogo de {DIA(e.data_hora)}?</strong>
        <span>{grupoId ? '' : `${e.grupo_nome} · `}Falta avaliar {e.faltam} {e.faltam === 1 ? 'pessoa' : 'pessoas'}</span>
      </div>
      <span className="aviso-avaliar__acao">Avaliar</span>
    </Link>
  ))
}

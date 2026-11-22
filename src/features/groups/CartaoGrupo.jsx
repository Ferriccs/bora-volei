import { Link } from 'react-router-dom'
import Pilula from '../../components/Pilula.jsx'
import { CARGOS, nomeDias, nomeModalidade, nomeNivel } from './textos.js'

// Cartão azul com o resumo de um grupo (usado em "Seus grupos" e na busca).
// "acao" é um botão opcional à direita (ex.: "Pedir para entrar").
export default function CartaoGrupo({ grupo, link = true, acao, mostrarCargo = false }) {
  const conteudo = (
    <>
      <div className="cartao-grupo__topo">
        <h3 className="cartao-grupo__nome">{grupo.nome}</h3>
        {mostrarCargo && grupo.situacao === 'pendente' && <Pilula destaque>Aguardando</Pilula>}
        {mostrarCargo && grupo.situacao === 'ativo' && grupo.cargo !== 'membro' && <Pilula>{CARGOS[grupo.cargo]}</Pilula>}
      </div>
      <p className="cartao-grupo__info">
        {nomeModalidade(grupo.modalidade)} · {grupo.municipio} - {grupo.uf}
        {grupo.dias?.length > 0 && <> · {nomeDias(grupo.dias)}</>}
      </p>
      <p className="cartao-grupo__info">
        {grupo.qtd_membros} {grupo.qtd_membros === 1 ? 'integrante' : 'integrantes'} · Nível mínimo: {nomeNivel(grupo.nivel_minimo)}
      </p>
      {grupo.descricao && <p className="cartao-grupo__descricao">{grupo.descricao}</p>}
    </>
  )

  return (
    <article className="cartao-grupo">
      {link ? <Link to={`/grupos/${grupo.id}`} className="cartao-grupo__link">{conteudo}</Link> : conteudo}
      {acao && <div className="cartao-grupo__acao">{acao}</div>}
    </article>
  )
}

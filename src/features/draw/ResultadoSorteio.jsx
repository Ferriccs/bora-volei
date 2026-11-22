import CaixaAzul from '../../components/CaixaAzul.jsx'
import { formatarNota } from '../../utils/nota.js'
import { dataLonga, hora } from '../../utils/datas.js'
import { nomeModalidade } from '../groups/textos.js'
import '../groups/grupos.css'

// Tela 16 do Figma: cabeçalho do encontro, um quadro por time (com a média) e a Barreira (reservas).
export default function ResultadoSorteio({ encontro, times, reservas, rodada }) {
  return (
    <>
      <CaixaAzul>
        <div className="cabecalho-sorteio">
          <div><strong>Local</strong>{encontro.local || '—'}</div>
          <div><strong>Modalidade</strong>{nomeModalidade(encontro.modalidade)}</div>
          <div><strong>Horário</strong>{hora(encontro.data_hora)}</div>
          <div><strong>Data</strong>{dataLonga(encontro.data_hora)}</div>
          {rodada && <div><strong>Rodada</strong>{rodada}ª</div>}
        </div>
      </CaixaAzul>

      <div className="times">
        {times.map((t) => (
          <section key={t.letra} className="time" aria-label={`Time ${t.letra}`}>
            <h3 className="time__titulo">Time {t.letra}</h3>
            {t.jogadores.map((j) => (
              <div key={j.chave} className="time__jogador">
                {j.nome}{j.convidado && <small>(convidado)</small>}
              </div>
            ))}
            <div className="time__media">Média: {formatarNota(t.media)}</div>
          </section>
        ))}
      </div>

      {reservas.length > 0 && (
        <section className="barreira" aria-label="Barreira">
          <h3>Barreira ({reservas.length})</h3>
          <p style={{ fontWeight: 500 }}>{reservas.map((j) => j.nome).join(', ')}</p>
        </section>
      )}
    </>
  )
}

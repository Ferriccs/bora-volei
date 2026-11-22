import { useEffect, useId, useState } from 'react'
import CampoTexto from './CampoTexto.jsx'
import { UFS, buscarMunicipios } from '../features/onboarding/municipios.js'

// Estado + município (com a lista do IBGE para escolher). Usado em Novo grupo e Buscar grupos.
export default function CampoMunicipio({ uf, municipio, onChange, erro }) {
  const [lista, setLista] = useState([])
  const idLista = useId()

  useEffect(() => {
    let ativo = true
    buscarMunicipios(uf).then((l) => ativo && setLista(l)).catch(() => ativo && setLista([]))
    return () => { ativo = false }
  }, [uf])

  return (
    <>
      <CampoTexto rotulo="Estado" elemento="select" value={uf}
        onChange={(e) => onChange({ uf: e.target.value, municipio: '' })}>
        {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
      </CampoTexto>
      <CampoTexto rotulo="Município" list={idLista} autoComplete="off" placeholder="Digite e escolha da lista"
        value={municipio} onChange={(e) => onChange({ uf, municipio: e.target.value })} erro={erro} />
      <datalist id={idLista}>{lista.map((m) => <option key={m} value={m} />)}</datalist>
    </>
  )
}

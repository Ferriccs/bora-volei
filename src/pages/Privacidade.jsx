import { Link } from 'react-router-dom'
import BarraTitulo from '../components/BarraTitulo.jsx'
import CaixaAzul from '../components/CaixaAzul.jsx'

// Política de privacidade (o Google pede este endereço para liberar o login com Google para todos).
export default function Privacidade() {
  return (
    <main className="tela tela--media">
      <BarraTitulo grande as="h1">Privacidade</BarraTitulo>
      <CaixaAzul>
        <div className="texto-longo">
          <p>O Bora Vôlei é um projeto acadêmico do curso de Sistemas de Informação, feito para sortear times de vôlei equilibrados entre amigos. Esta página explica, de forma simples, quais dados o app usa e por quê.</p>

          <h2>Quais dados guardamos</h2>
          <ul>
            <li><strong>Conta:</strong> nome e e-mail. Se você entrar com o Google, recebemos só o seu nome, e-mail e foto de perfil do Google.</li>
            <li><strong>Perfil:</strong> o que você preenche no primeiro acesso (nível, tempo de jogo, posições, município, data de nascimento e bio).</li>
            <li><strong>Grupos e encontros:</strong> de quais grupos você participa, presenças confirmadas, sorteios e quem jogou.</li>
            <li><strong>Avaliações:</strong> as estrelas que você dá e recebe. Elas são anônimas: ninguém no app vê quem deu cada nota, só a nota final.</li>
            <li><strong>Chat:</strong> as mensagens que você envia nos grupos. O seu telefone só aparece se você tocar em "Compartilhar contato".</li>
          </ul>

          <h2>Para que usamos</h2>
          <p>Somente para o app funcionar: entrar na sua conta, mostrar seus grupos, montar os sorteios, calcular a nota de cada jogador e mostrar o chat. Não vendemos nem compartilhamos seus dados com ninguém, e não usamos anúncios.</p>

          <h2>Onde ficam</h2>
          <p>Os dados ficam guardados no Supabase, um serviço de banco de dados na nuvem, protegidos por regras que só deixam cada pessoa ver o que pode (por exemplo, só integrantes veem o chat de um grupo).</p>

          <h2>Seus direitos</h2>
          <p>Você pode editar seu perfil a qualquer momento em "Meu perfil", sair de qualquer grupo e apagar suas mensagens. Para apagar sua conta e todos os seus dados, abra um pedido em <a href="https://github.com/Ferriccs/bora-volei/issues" target="_blank" rel="noreferrer">github.com/Ferriccs/bora-volei/issues</a> e a equipe apaga tudo.</p>

          <p className="texto-longo__data">Atualizada em 22 de novembro de 2026.</p>
        </div>
      </CaixaAzul>
      <div className="centro"><Link to="/login" className="link-escuro">Voltar</Link></div>
    </main>
  )
}

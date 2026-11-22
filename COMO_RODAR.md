# Bora Vôlei: como rodar o app

## Primeira vez (só uma vez)
1. Abra o terminal (PowerShell) dentro da pasta `D:\AppVolei\app`.
   Dica: abra a pasta no Explorador, clique na barra de endereço, digite `powershell` e aperte Enter.
2. Instale as peças do projeto:
   ```
   npm install
   ```
   Demora 1 ou 2 minutos e só precisa fazer de novo quando o `package.json` mudar.

## Para abrir o app
```
npm run dev
```
O terminal vai mostrar dois endereços:
- `Local: http://localhost:5173/` abre no navegador do computador.
- `Network: http://192.168.x.x:5173/` abre no celular, se ele estiver no mesmo Wi-Fi.

Para parar, aperte `Ctrl + C` no terminal.

## Etapa 2: configurar o Supabase (só uma vez)
**0. Criar o arquivo `.env.local`** (guarda o endereço e a chave pública do seu Supabase)
No PowerShell, dentro de `D:\AppVolei\app`, cole este comando inteiro e aperte Enter:
```
Set-Content .env.local -Encoding ascii -Value "VITE_SUPABASE_URL=https://azaqhzqxhbvvzfpyftkp.supabase.co","VITE_SUPABASE_ANON_KEY=sb_publishable_4Lvic66heft38KcZNXBQ0A_pDU0TT9F"
```
Depois faça 3 coisas no painel do Supabase (supabase.com, dentro do projeto):

**1. Criar a tabela de perfis**
- Menu da esquerda > **SQL Editor** > botão **New query**.
- Abra o arquivo `supabase\migrations\001_perfis.sql` (no Bloco de Notas ou VS Code), copie tudo e cole lá.
- Clique em **Run**. Deve aparecer "Success. No rows returned".

**2. Dizer ao Supabase o endereço do app** (para os links de e-mail voltarem para o app)
- Menu da esquerda > **Authentication** > **URL Configuration**.
- Em **Site URL**, coloque: `http://localhost:5173`
- Em **Redirect URLs**, clique em **Add URL** e adicione: `http://localhost:5173/**`
  (se for testar no celular, adicione também o endereço "Network", por exemplo `http://192.168.0.10:5173/**`)
- Clique em **Save**.

**3. (Opcional, recomendado para testes) Entrar sem confirmar o e-mail**
O Supabase grátis manda só poucos e-mails por hora. Para testar várias contas à vontade:
- **Authentication** > **Sign In / Providers** > **Email** > desligue **Confirm email** > **Save**.
- Antes de usar de verdade, ligue de novo.

Nunca envie o `.env.local` para o GitHub (ele já está no `.gitignore`).

## Teste da etapa 2
1. `npm run dev` e abra `http://localhost:5173` → abre o **Login**.
2. Toque em **Criar conta**, preencha e crie.
3. Preencha o **Primeiro acesso** (nível, tempo, posições, município) e toque em **Continuar**.
4. Aparece "Olá, (seu nome)!" com seu perfil. No Supabase, em **Table Editor > profiles**, sua linha aparece lá.
5. Toque em **Sair da conta** e entre de novo com o e-mail e a senha.
6. Teste também **Esqueci minha senha** (o link chega no e-mail e abre a tela **Nova senha**).

O botão **Entrar com Google** só funciona depois de configurar o Google (passo a passo em separado).

## Etapa 3: grupos (só uma vez)
No Supabase, **SQL Editor** > **+** > **Create a new snippet**, cole todo o arquivo
`supabase\migrations\002_grupos.sql` e clique em **Run** (confirme o aviso "destructive operations").
Deve aparecer "Success. No rows returned".

### Teste da etapa 3
1. Entre com a sua conta: abre **Seus grupos** (vazio).
2. **Criar grupo**: preencha e crie. Abre a tela do grupo, com você como **Dono**.
3. Em outra janela anônima do navegador (Ctrl + Shift + N), entre com outra conta (ex.: a do João),
   vá em **Buscar grupos** e toque em **Pedir para entrar**.
4. Volte na sua conta, abra o grupo, toque em **Pedidos (1)** e **Aceitar**.
5. Na lista de integrantes, teste **Tornar admin**, **Tirar admin** e **Remover**.

## Etapa 4: convites e perfil (só uma vez)
1. No PowerShell, dentro de `D:\AppVolei\app`, rode `npm install` (entrou uma biblioteca nova, a do QR Code).
2. No Supabase, **SQL Editor** > **+** > **Create a new snippet**, cole todo o arquivo
   `supabase\migrations\003_convites.sql` e clique em **Run** (confirme o aviso).

### Teste da etapa 4
1. Abra seu grupo e toque em **Convidar amigos**: aparece o QR Code, a validade (7 dias) e o link.
2. Toque em **Copiar link** e abra o link numa janela anônima (Ctrl + Shift + N).
3. Sem conta, aparece o grupo e os botões **Entrar** / **Criar conta**. Entre com outra conta:
   você volta sozinho para o convite. Toque em **Entrar no grupo**, e pronto, já é integrante.
4. Toque no nome de alguém na lista de integrantes para ver o **perfil** (e "Meu perfil" no topo).

Atenção: enquanto o app roda no seu computador, o link começa com `http://localhost:5173`, que só funciona
no seu PC. Para testar no celular, abra o app pelo endereço **Network** (ex.: `http://192.168.0.10:5173`) e
gere o convite por lá. Na etapa 7, quando o app for publicado na internet, o link funciona em qualquer lugar.

## Etapa 5: encontros e sorteio (só uma vez)
No Supabase, **SQL Editor** > **+** > **Create a new snippet**, cole todo o arquivo
`supabase\migrations\004_encontros.sql` e clique em **Run** (confirme o aviso).

### Teste da etapa 5
1. Abra seu grupo e, na caixa **Próximo encontro**, toque em **+ Criar encontro**. Escolha data e horário.
2. Na tela do encontro, toque em **Confirmar presença**. Com outras contas (janela anônima), confirme também.
3. Se alguém vai sem ter o app, adicione em **Convidado sem conta** (nome e nível).
4. Toque em **Montar sorteio**: marque quem joga, escolha quantos por time e se a posição influencia.
5. **Sortear times** mostra os times com a média de cada um e a **Barreira** (reservas).
   - **Sortear de novo**: outro sorteio. **Salvar sorteio** (dono/admin): todos do grupo podem ver.
   - **Próxima rodada**: quem ficou na Barreira entra (ou, no modo "quem perde sai", o time que perdeu sai).
6. Depois do horário do jogo, o dono/admin toca em **Quem jogou** e marca quem realmente jogou.

## Etapa 6: avaliações e chat (só uma vez)
No Supabase, **SQL Editor** > **+** > **Create a new snippet**, cole todo o arquivo
`supabase\migrations\005_avaliacoes_chat.sql` e clique em **Run** (confirme o aviso).

### Teste da etapa 6
1. **Avaliação geral**: abra o grupo e, na caixa **Avaliação (anônimo)** lá embaixo, toque nas estrelas
   de alguns jogadores. Abra o perfil de um deles: a nota mudou e aparece "X avaliações".
   No perfil também dá para avaliar, e aparece "Jogou com você X vezes".
2. **Avaliação pós-encontro**: num encontro que já passou, o dono/admin marca **Quem jogou** (marque você também).
   Aparece o aviso amarelo **"Como foi o jogo de ...?"** em Seus grupos e na tela do grupo, e o botão
   **Avaliar quem jogou** no encontro. Dê as estrelas e toque em **Enviar avaliações**. Fica aberto por 3 dias.
3. **Nota no sorteio**: em **Montar sorteio**, a nota de cada um agora já vem das avaliações.
4. **Chat**: na tela do grupo, toque em **Chat do grupo** e mande uma mensagem. Para ver o tempo real,
   abra o mesmo chat com outra conta numa janela anônima: a mensagem chega sem recarregar.
   **Compartilhar contato** manda o seu telefone para o grupo, com o botão "Chamar no WhatsApp".
   Quando alguém cria um encontro, aparece um aviso amarelo no chat.

## Etapa 7: publicar o site e gerar o APK
Nesta etapa entraram bibliotecas novas (Capacitor). Se for rodar no PC, rode `npm install` uma vez.

### 1. Código no GitHub
1. Ligue o seu GitHub ao Claude: https://claude.ai/connect-github
2. No GitHub, crie um repositório **vazio** chamado `bora-volei` (sem README). Público é o mais fácil
   (o professor consegue ver o código e o APK baixa sem login). A chave do Supabase que está no código é a pública.
3. Avise o Claude o nome do repositório. Ele envia o código para lá.

### 2. Site na internet (Vercel, gratuito)
1. Entre em https://vercel.com e clique em **Sign Up** > **Continue with GitHub**.
2. **Add New...** > **Project** > escolha `bora-volei` > **Import**.
3. Abra **Environment Variables** e adicione as duas:
   - `VITE_SUPABASE_URL` = `https://azaqhzqxhbvvzfpyftkp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_4Lvic66heft38KcZNXBQ0A_pDU0TT9F`
4. Clique em **Deploy**. Em 1 minuto aparece o endereço (ex.: `https://bora-volei.vercel.app`).
5. No Supabase: **Authentication** > **URL Configuration**:
   - **Site URL**: o endereço da Vercel.
   - **Redirect URLs** > **Add URL**: o endereço da Vercel com `/**` no final (ex.: `https://bora-volei.vercel.app/**`).
     Deixe também o `http://localhost:5173/**` para continuar testando no PC.
6. Mande o endereço para o Claude (ele ajusta os links de convite do APK).
Depois disso, toda vez que o código mudar no GitHub, a Vercel publica a versão nova sozinha.

### 3. Instalar como app pelo navegador (PWA)
No celular, abra o endereço da Vercel no Chrome e toque em **Instalar app** (na tela de login ou em Seus grupos),
ou no menu ⋮ > **Instalar app**. No iPhone: Safari > Compartilhar > **Adicionar à Tela de Início**.

### 4. APK para Android
O APK é gerado sozinho pelo GitHub (sem Android Studio) toda vez que o código muda:
1. No repositório, aba **Actions**: espere o "Gerar APK" ficar verde (uns 5 minutos).
2. Aba **Releases** (lado direito da página do repositório) > **APK do Bora Vôlei** > baixe `BoraVolei.apk` no celular.
3. Abra o arquivo. O Android pede para permitir "instalar apps desconhecidos": permita e instale.
No APK o login é por e-mail e senha (o Google não deixa entrar com Google dentro de apps desse tipo).
No site e no app instalado pelo navegador, o login com Google funciona normalmente.

## O que já tem
- Etapa 1: a página `/amostra` mostra todos os pedaços visuais (botões, campos, caixas, estrelas, logo).
- Etapa 2: Login, Criar conta, Esqueci a senha, Nova senha e Primeiro acesso, ligados ao Supabase.
- Etapa 3: Seus grupos, Novo grupo, Editar grupo, Buscar grupos, Tela do grupo e Pedidos de entrada.
- Etapa 4: Convite por link e QR Code (7 dias), Entrar no grupo pelo convite e Perfil do jogador.
- Etapa 5: Criar encontro, confirmar presença, convidados sem conta, sorteio balanceado com Barreira e rodadas, sorteio salvo e Quem jogou.
- Etapa 6: avaliação anônima (geral e pós-encontro), nota do jogador calculada, "jogou com você", chat em tempo real e compartilhar contato.
- Layout próprio para PC (barra de cima, duas colunas) e para celular.
- Etapa 7: botão Instalar app (PWA), site pronto para a Vercel e projeto Android (Capacitor) com APK gerado pelo GitHub.
- As outras telas aparecem como "Esta tela será construída na etapa X".
- Fonte: Chakra Petch. Cores: azul #276E8D e cinza #D9D9D9.

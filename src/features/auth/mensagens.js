// Traduz os erros do Supabase (que vêm em inglês) para mensagens simples.
export function traduzirErro(erro) {
  if (!erro) return ''
  // Erros que o nosso próprio SQL cria (raise exception) já vêm em português
  if (erro.code === 'P0001') return erro.message
  const msg = (erro.message || String(erro)).toLowerCase()

  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('email not confirmed')) return 'Falta confirmar seu e-mail. Abra o link que enviamos para você.'
  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return 'Já existe uma conta com este e-mail. Tente entrar ou use "Esqueci minha senha".'
  if (msg.includes('password should be at least') || msg.includes('weak password'))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('for security purposes'))
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  if (msg.includes('unable to validate email') || msg.includes('invalid email') || msg.includes('is invalid'))
    return 'Este e-mail não parece válido.'
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider'))
    return 'O login com Google ainda não foi ativado no Supabase.'
  if (msg.includes('same_password') || msg.includes('should be different'))
    return 'A nova senha precisa ser diferente da antiga.'
  if (msg.includes('auth session missing') || msg.includes('expired'))
    return 'Este link expirou. Peça um novo em "Esqueci minha senha".'
  if (msg.includes('failed to fetch') || msg.includes('network'))
    return 'Sem conexão com a internet. Confira e tente de novo.'
  return 'Algo deu errado: ' + (erro.message || erro)
}

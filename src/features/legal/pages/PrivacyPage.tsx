import { Card } from '@/components/ui/Card';

export function PrivacyPage() {
  return (
    <Card className="grid gap-3">
      <h1 className="text-2xl font-bold text-ink-strong">Politica de Privacidade</h1>
      <p className="text-sm leading-6 text-ink-muted">Coletamos somente dados necessarios para dividir a conta: nome da mesa, nome exibido dos participantes, horarios, itens, pagamentos e aceite legal.</p>
      <p className="text-sm leading-6 text-ink-muted">Nao pedimos CPF, telefone, endereco, e-mail, senha ou dados sensiveis. Fotos de nota sao opcionais e devem ficar em armazenamento privado.</p>
      <p className="text-sm leading-6 text-ink-muted">OCR externo so deve ser ativado depois de configurar fornecedor, secrets seguros e informacao clara sobre tratamento da imagem.</p>
      <p className="text-sm leading-6 text-ink-muted">Esta estrutura segue boas praticas tecnicas de privacidade, sujeita a revisao juridica antes de publicacao ampla.</p>
    </Card>
  );
}

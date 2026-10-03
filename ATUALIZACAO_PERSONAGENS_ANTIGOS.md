# Compatibilidade com personagens antigos

- Personagens criados antes das regras de ancestralidade mantêm seus atributos e habilidades originais.
- Ao abrir uma ficha antiga, o jogador recebe a janela **Características raciais pendentes**.
- Bônus fixos de raça são reconhecidos automaticamente; escolhas flexíveis pedem o atributo permitido.
- A linhagem pede uma habilidade de cada categoria configurada, impedindo repetir a mesma habilidade.
- Os bônus são salvos separadamente em `racial_attribute_bonus` e `lineage_skill_bonuses`.
- A ficha calcula atributos, habilidades, PV, PM e derivados usando base + bônus.
- Personagens novos também passam a salvar valores-base separadamente dos bônus.
- O Painel do Mestre exibe o valor efetivo e identifica quando há bônus racial/de linhagem.

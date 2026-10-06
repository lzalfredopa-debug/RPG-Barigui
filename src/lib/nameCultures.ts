export type NamingCulture = {
  title: string;
  description: string;
  examples: string[];
  applied: string;
};

export const NAMING_CULTURES: Record<string, NamingCulture> = {
  humanos: {
    title: 'Nomes humanos',
    description: 'O nome humano costuma reforçar a identidade individual e o pertencimento. Sobrenomes, quando usados, podem carregar família, origem, posição social ou a reputação construída ao longo da vida.',
    examples: ['Osvaldo', 'Kenzo', 'Helena', 'Edgar', 'Aldo', 'Mei', 'Bruno'],
    applied: 'Kenzo pode ser conhecido apenas pelo nome no cotidiano, enquanto um sobrenome ou complemento revela de onde veio, a quem pertence ou pelo que sua família é lembrada.',
  },
  elfos: {
    title: 'Nomes élficos',
    description: 'Nomes élficos tendem a soar antigos, tradicionais e marcantes. Em geral funcionam bem sozinhos; um segundo elemento pode indicar casa, título, origem, parentesco ou um epíteto conquistado.',
    examples: ['Aelirien', 'Thalendir', 'Elenwe', 'Vaelora', 'Saerith', 'Lorien'],
    applied: 'Thalendir pode atravessar décadas apenas com seu nome; quando necessário, uma casa, um título ou um epíteto passa a acompanhá-lo para situá-lo na história.',
  },
  anoes: {
    title: 'Nomes anões',
    description: 'Anões preferem nomes fortes e reconhecíveis. Sobrenomes costumam preservar a memória de ancestrais, famílias, fortalezas, montanhas, oficinas ou lugares importantes para sua história.',
    examples: ['Durgan Morgran', 'Brunna Durnhal', 'Torgrim Kar-Dhor'],
    applied: 'Torgrim Kar-Dhor não carrega apenas um sobrenome: Kar-Dhor diz a outros anões de qual memória, lugar ou tradição ele vem.',
  },
  orcs: {
    title: 'Nomes orcs',
    description: 'O nome recebido identifica o indivíduo, mas o complemento que realmente marca um orc costuma ser conquistado. Feitos, sobrevivências, derrotas, cicatrizes e acontecimentos podem se transformar em sobrenomes ou epítetos.',
    examples: ['Tarkan Muralha', 'Boran Sete-Invernos', 'Otar Último-de-Pé'],
    applied: 'Tarkan não nasceu “Muralha”; passou a ser chamado assim depois que um acontecimento fez o nome merecer ser repetido.',
  },
  pequeninos: {
    title: 'Nomes pequeninos',
    description: 'Entre pequeninos, nomes costumam soar próximos e familiares. Diminutivos, nomes herdados, apelidos carinhosos e formas usadas dentro da família podem acabar se tornando o nome pelo qual alguém é conhecido por toda a vida.',
    examples: ['Tobin', 'Nella', 'Milo', 'Berta', 'Pipo', 'Lina', 'Bram'],
    applied: 'Pipo pode ter recebido um nome mais formal ao nascer, mas se foi assim que família, vizinhos e amigos sempre o chamaram, Pipo é o nome que realmente importa.',
  },
  goblins: {
    title: 'Nomes goblins',
    description: 'Goblins tratam nomes quase como apelidos. Objetos, cores, hábitos, defeitos, acontecimentos e ações podem virar nomes sem cerimônia. Um segundo nome pode indicar grupo, lugar, objeto, marca ou oficina à qual o goblin está ligado.',
    examples: ['Prego', 'Coceira', 'Azul', 'Caneca', 'Chorador', 'Gritão'],
    applied: 'Prego da Oficina é suficiente: “Prego” é quem ele é; “da Oficina” explica onde os outros devem procurá-lo — ou de quem devem reclamar.',
  },
  tiferinos: {
    title: 'Nomes tiferinos',
    description: 'Tiferinos frequentemente usam nomes de sonoridade angelical, solene e elevada. Mesmo quando a vida ao redor é áspera, o nome pode preservar uma ideia de grandeza, destino ou beleza antiga.',
    examples: ['Seraphiel', 'Azariel', 'Meriel', 'Caeliel', 'Raziel', 'Anael', 'Samiel'],
    applied: 'Azariel pode ser ladrão, sacerdote ou mercador; o nome continua carregando uma solenidade que antecede qualquer ofício que ele venha a exercer.',
  },
  'povo-fungico': {
    title: 'Nomes do povo fúngico',
    description: 'O indivíduo possui um nome próprio, mas nasce ligado ao micélio, à colônia e à comunidade viva da qual faz parte. Por isso, a forma completa do nome costuma expressar também essa ligação coletiva.',
    examples: ['Moru de Ulum', 'Nushen de Velmor', 'Lumai de Numara'],
    applied: 'Moru é o indivíduo; “de Ulum” lembra que sua existência nunca é inteiramente separada da rede viva à qual pertence.',
  },
  draconatos: {
    title: 'Nomes draconatos',
    description: 'Nomes draconatos estão ligados a legado e continuidade. Um nome pode ser herdado e repetido por gerações, enquanto títulos e epítetos acumulados distinguem cada portador e acrescentam novas camadas à história familiar.',
    examples: ['Aurel, o Navegante', 'Aurel, a Cinzenta', 'Aurel, o Último'],
    applied: 'Três Aurel não são três pessoas com nomes repetidos por acaso: cada um recebe o legado anterior e acrescenta ao nome aquilo que sua própria vida conquistou.',
  },
  'povo-fera': {
    title: 'Nomes do povo fera',
    description: 'Nomes do povo fera costumam se relacionar à natureza e ao pertencimento. Grupo, território, estação, clima ou fenômenos naturais podem acompanhar o nome e dizer algo importante sobre a origem daquela pessoa.',
    examples: ['Naira da Primeira Chuva', 'Raska do Inverno Longo', 'Taren da Matilha do Vale'],
    applied: 'Naira da Primeira Chuva carrega no próprio nome uma memória de tempo e lugar, permitindo que origem e identidade caminhem juntas.',
  },
};

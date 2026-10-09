-- TRILHA: textos de base para Povos e Vertentes.
-- Revisão editorial: estes textos são reconstruções, NÃO transcrições exatas de conversas anteriores.
-- Só atualiza descrições vazias ou idênticas aos resumos da instalação inicial.
-- Descrições extensas já registradas pelo Mestre permanecem intocadas.
-- As alterações continuam editáveis em Controle > Povos e Vertentes.

UPDATE public.races SET description = 'Ninguém sabe ao certo de onde vieram os humanos. Os registros mais antigos já os encontram espalhados por regiões muito distantes entre si, sem uma terra natal comum ou uma grande migração ancestral reconhecida. Quando a história começou a ser escrita, os humanos simplesmente já estavam lá.

Talvez por isso existam tantas histórias diferentes sobre seu surgimento. Algumas tradições dizem que nasceram do barro; outras, que vieram do mar, foram moldados por deuses tardios ou expulsos de uma terra hoje perdida. Nenhuma dessas versões conseguiu se impor como verdade.

Fisicamente, apresentam enorme variedade de altura, constituição, tonalidade de pele e aparência. Culturalmente, talvez sejam o povo mais difícil de definir: reconhecem-se antes por cidade, reino, língua, ofício ou comunidade do que por uma identidade humana única. A diversidade também explica a velocidade com que suas culturas surgem, se misturam e desaparecem.

Nomes
Entre os humanos, o nome identifica uma pessoa e também denuncia escolhas, esperanças e, às vezes, o gosto duvidoso de seus pais. Sobrenomes podem indicar família, procedência, profissão ancestral, aliança, prestígio ou uma reputação que alguém preferiria deixar para trás.' WHERE id = 'humanos' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Adaptáveis e diversos, os humanos prosperam nos mais diferentes ambientes e sociedades.');

UPDATE public.races SET description = 'Dizem os elfos que seu povo surgiu quando a primeira luz do sol alcançou o mundo. Se a história é verdadeira, ninguém pode provar; mas entre eles há quem considere essa lembrança mais antiga do que qualquer reino.

De traços delicados, orelhas marcantes e vidas longas, os elfos percebem a passagem do tempo de maneira distinta. A longevidade não torna todos sábios: alguns aprendem a esperar, outros cultivam ressentimentos por séculos. Entre suas comunidades, a memória pode ser um tesouro, um dever ou uma prisão.

Não há uma única cultura élfica. Florestas, cidades, observatórios e lugares subterrâneos abrigam tradições bastante diferentes. Em muitas delas, a palavra falada merece cuidado especial, pois o que é nomeado adquire peso no mundo.

Nomes
Um nome élfico costuma expressar uma esperança sobre aquilo que alguém poderá se tornar. Por acreditarem no poder das palavras, famílias escolhem nomes como quem oferece uma bênção — ou teme lançar uma maldição. Nomes antigos podem atravessar gerações, e sobrenomes nem sempre são necessários.' WHERE id = 'elfos' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos longevos de tradições refinadas, marcados por diferentes relações com o mundo natural, o céu e as profundezas.');

UPDATE public.races SET description = 'Os anões contam histórias de antepassados que aprenderam a ouvir o interior das montanhas. Alguns dizem ter nascido da própria pedra; outros tratam essas narrativas como metáforas para a persistência de seu povo.

Baixos, robustos e resistentes, são conhecidos pela habilidade de transformar matérias difíceis em instrumentos de uso cotidiano e obras capazes de sobreviver a seus criadores. Ainda assim, reduzi-los à mineração e à metalurgia seria ignorar seus comerciantes, navegadores, músicos e estudiosos.

Entre muitas comunidades anãs, a palavra dada é uma construção: deve resistir ao tempo. O pertencimento pode ser definido por família, oficina, cidade ou por aqueles que partilharam trabalho e dificuldade.

Nomes
Os nomes anões tendem a ter sonoridade firme e consonantes marcadas. Sobrenomes preservam linhagens, casas, ofícios e feitos transmitidos entre gerações. Nem todo sobrenome é herdado: alguns são conquistados ou adotados para honrar uma promessa.' WHERE id = 'anoes' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos robustos de constituição resistente, ligados a antigas tradições de montanha, pedra e ofício.');

UPDATE public.races SET description = 'Os orcs ocupam terras tão diferentes que ninguém poderia apontar um único lugar como seu berço. Entre montanhas geladas, campos secos e vales escarpados, suas comunidades desenvolveram costumes próprios para resistir ao ambiente e aos conflitos.

A força dos orcs é evidente, mas não explica sua história. A vida em grupo, a coragem de assumir responsabilidades e a capacidade de atravessar tempos difíceis costumam ter mais valor do que a simples vitória em combate. Existem orcs guerreiros, construtores, criadores de animais e guardiões de tradições orais.

Em muitas comunidades, o indivíduo não é definido apenas pelo que recebeu ao nascer, mas pelo que fez depois disso.

Nomes
Nomes pessoais orcs costumam ser curtos e vigorosos. Títulos e sobrenomes frequentemente são conquistados por atos, decisões, derrotas superadas ou compromissos honrados. Um nome de feito pode permanecer por toda a vida — mesmo quando seu portador preferiria esquecê-lo.' WHERE id = 'orcs' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos de grande potência física, moldados por comunidades e ambientes diversos.');

UPDATE public.races SET description = 'Os pequeninos são encontrados em aldeias, embarcações, bairros movimentados e estradas comerciais. De baixa estatura e movimentos rápidos, aprenderam a fazer do espaço que ocupam um lugar próprio, mesmo quando esse espaço muda de endereço.

Muitos valorizam a hospitalidade, a conversa e os pequenos prazeres cotidianos, mas isso não significa que sejam avessos à aventura. Há pequeninos que viajam por curiosidade, necessidade, ambição ou pela simples vontade de descobrir o que existe depois da curva do caminho.

As relações de vizinhança, parentesco e amizade frequentemente pesam tanto quanto antigas leis. Um lar pode ser uma casa, um barco ou as pessoas que aceitam dividir a última refeição.

Nomes
Seus nomes costumam soar familiares, agradáveis ou divertidos. Apelidos nascem de hábitos, parentescos e acontecimentos domésticos, e alguns sobrevivem por gerações. Sobrenomes muitas vezes lembram lugares, comidas, ofícios ou histórias de família.' WHERE id = 'pequeninos' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos de pequena estatura, ágeis e adaptados a diferentes paisagens e modos de vida.');

UPDATE public.races SET description = 'Os goblins são mestres em descobrir utilidade onde outros enxergam apenas sucata. Pequenos, atentos e persistentes, espalharam-se por cavernas, copas de árvores, oficinas e cidades, adaptando ferramentas e costumes ao que encontram.

Sua criatividade não é sinônimo de desordem. Muitas comunidades goblins possuem regras minuciosas sobre trocas, favores, posse e invenções. O prestígio pode vir de uma solução brilhante, de uma negociação improvável ou da habilidade de reparar o que parecia perdido.

De povoado a povoado, variam as formas de demonstrar pertencimento, mas a identidade costuma ser algo vivido e reconhecido pelos outros, não apenas declarado.

Nomes
Goblins gostam de nomes tirados de objetos, cores, sensações e ações: Prego, Caneca, Azul, Coceira, Chorador ou Gritão. Um apelido pode substituir o nome de nascimento. Sobrenomes, quando usados, costumam indicar o grupo ou a comunidade à qual alguém pertence.' WHERE id = 'goblins' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos engenhosos e habilidosos, conhecidos pela precisão manual e adaptação a ambientes incomuns.');

UPDATE public.races SET description = 'Os tiferinos são reconhecidos por marcas que muitos associam ao sobrenatural: chifres, caudas, olhos incomuns e traços que variam de pessoa para pessoa. Essas características, porém, contam pouco sobre a índole de quem as carrega.

Algumas tradições atribuem sua origem a pactos remotos; outras falam em antigas migrações, heranças que atravessaram famílias ou acontecimentos que já não podem ser verificados. Em diferentes lugares são recebidos com curiosidade, respeito ou desconfiança.

Como vivem entre culturas diversas, é difícil apontar um costume único dos tiferinos. Muitos constroem seu pertencimento pela comunidade que os acolheu ou que ajudaram a erguer.

Nomes
É comum encontrar nomes de sonoridade celestial, virtuosa ou solene, às vezes escolhidos como desejo de proteção e contraste com a aparência. Outros adotam os nomes da sociedade em que nasceram, sem qualquer necessidade de explicar sua ancestralidade.' WHERE id = 'tiferinos' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos marcados por heranças sobrenaturais diversas, cuja presença social pode assumir muitas formas.');

UPDATE public.races SET description = 'Os fúngicos não contam seu surgimento como uma história de nascimento individual, mas como o despertar de uma rede antiga. Para muitos, existir é fazer parte de algo maior: um micélio, uma colônia, um ciclo de crescimento, decomposição e renovação.

Seus corpos assumem formas variadas, com fibras, chapéus, pigmentos e brilhos diferentes. Alguns vivem junto de extensas redes subterrâneas; outros caminham pelo mundo, carregando consigo vínculos que não desaparecem com a distância.

A relação com o tempo, com a morte e com a memória é profundamente influenciada pela ideia de continuidade. O fim de um corpo não precisa significar o fim daquilo que ele partilhou com a colônia.

Nomes
Um fúngico pode possuir um nome individual e outro que o relaciona ao micélio de origem. Esses nomes não são rivais: um indica quem fala, o outro lembra de quantos fazem parte de sua história.' WHERE id = 'povo-fungico' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Seres fúngicos de formas variadas, ligados a ciclos naturais, redes de vida e percepções próprias do mundo.');

UPDATE public.races SET description = 'Os draconatos carregam no corpo vestígios de uma ancestralidade que desperta fascínio e temor. Escamas, chifres, cristas e olhares intensos variam entre indivíduos, e as tradições sobre sua origem são tão numerosas quanto os povos que convivem com eles.

Algumas comunidades guardam relatos de antigos dragões e juramentos ancestrais; outras rejeitam a ideia de que seu destino tenha sido decidido por criaturas do passado. A honra, quando valorizada, costuma ter menos a ver com orgulho vazio e mais com a responsabilidade de sustentar uma palavra.

Embora metais, cores e gemas inspirem maneiras de descrever suas aparências, nenhum desses sinais determina caráter ou cultura.

Nomes
Os nomes draconatos frequentemente evocam memória, legado e continuidade. Podem homenagear ancestrais, preservar juramentos ou recordar acontecimentos marcantes. Um nome transmitido é também uma responsabilidade, mas não precisa ser uma sentença.' WHERE id = 'draconatos' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos de herança dracônica cuja aparência e imponência refletem linhagens metálicas, cromáticas ou gemáticas.');

UPDATE public.races SET description = 'O povo fera reúne comunidades de aparências muito diferentes, com pelagens, penas, focinhos, bicos, garras e sentidos variados. Essa diversidade torna impossível resumir suas histórias a uma única origem.

Alguns vivem em grupos antigos ligados a determinados territórios; outros cresceram em cidades compartilhadas com muitos povos. A relação com o ambiente costuma deixar marcas em técnicas, festas, modos de deslocamento e formas de convivência, sem que isso determine a personalidade de cada pessoa.

Aquilo que um viajante chama de instinto pode ser, para uma comunidade fera, conhecimento transmitido por gerações, observação cuidadosa ou uma tradição de família.

Nomes
Seus nomes podem mencionar paisagens, estações, sons, qualidades ou acontecimentos. Em algumas comunidades, referências à natureza e ao grupo de origem acompanham o indivíduo; em outras, nomes pessoais mudam conforme a experiência e o reconhecimento coletivo.' WHERE id = 'povo-fera' AND (description IS NULL OR btrim(description) = '' OR btrim(description) = 'Povos de características animais variadas, capazes de expressar diferentes adaptações físicas.');

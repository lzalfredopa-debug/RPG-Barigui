-- TRILHA — Tarefas 2 e 3: Controle do Mestre, relógio, descansos e catálogo universal de itens
-- Execute DEPOIS de TRILHA_equipamentos_sobrevivencia_supabase.sql.
-- Esta migration é idempotente: pode ser executada novamente para atualizar o catálogo e as funções.

-- ============================================================
-- 1) CATÁLOGO UNIVERSAL DE ITENS
-- ============================================================
CREATE TABLE IF NOT EXISTS item_catalog (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  category_order integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_consumable boolean NOT NULL DEFAULT false,
  is_perishable boolean NOT NULL DEFAULT false,
  is_container boolean NOT NULL DEFAULT false,
  is_durable boolean NOT NULL DEFAULT false,
  unit text NOT NULL DEFAULT 'un',
  default_amount numeric NOT NULL DEFAULT 1 CHECK (default_amount > 0),
  capacity_ml integer CHECK (capacity_ml IS NULL OR capacity_ml > 0),
  shelf_life_minutes bigint CHECK (shelf_life_minutes IS NULL OR shelf_life_minutes > 0),
  durability_max integer CHECK (durability_max IS NULL OR durability_max BETWEEN 1 AND 5),
  repairable boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE item_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE item_catalog FROM anon, authenticated;

INSERT INTO item_catalog
(id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes)
VALUES
('tocha','Tocha','Iluminação e fogo',1,1,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('lanterna','Lanterna','Iluminação e fogo',1,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('vela','Vela','Iluminação e fogo',1,3,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('oleo-de-iluminacao','Óleo de iluminação','Iluminação e fogo',1,4,true,false,false,false,'ml',500,NULL,NULL,NULL,false,NULL),
('pederneira-e-aco','Pederneira e aço','Iluminação e fogo',1,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('isca-seca','Isca seca','Iluminação e fogo',1,6,true,false,false,false,'porção',1,NULL,NULL,NULL,false,NULL),
('pavio','Pavio','Iluminação e fogo',1,7,true,false,false,false,'m',1,NULL,NULL,NULL,false,NULL),
('corda','Corda','Cordas, escalada e acesso',2,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('cordame-fino','Cordame fino','Cordas, escalada e acesso',2,2,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('gancho-de-escalada','Gancho de escalada','Cordas, escalada e acesso',2,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pitao','Pitão','Cordas, escalada e acesso',2,4,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('escada-de-corda','Escada de corda','Cordas, escalada e acesso',2,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('pe-de-cabra','Pé-de-cabra','Cordas, escalada e acesso',2,6,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('gazuas','Gazuas','Cordas, escalada e acesso',2,7,false,false,false,true,'conjunto',1,NULL,NULL,2,true,NULL),
('corrente','Corrente','Cordas, escalada e acesso',2,8,false,false,false,true,'un',1,NULL,NULL,5,true,NULL),
('cadeado','Cadeado','Cordas, escalada e acesso',2,9,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('cunha','Cunha','Cordas, escalada e acesso',2,10,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('martelo','Martelo','Ferramentas e construção',3,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('marreta','Marreta','Ferramentas e construção',3,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('cinzel','Cinzel','Ferramentas e construção',3,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('machadinha','Machadinha','Ferramentas e construção',3,4,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('machado','Machado','Ferramentas e construção',3,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pa','Pá','Ferramentas e construção',3,6,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('picareta','Picareta','Ferramentas e construção',3,7,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('enxada','Enxada','Ferramentas e construção',3,8,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('serrote','Serrote','Ferramentas e construção',3,9,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('alicate','Alicate','Ferramentas e construção',3,10,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pregos','Pregos','Ferramentas e construção',3,11,true,false,false,false,'un',20,NULL,NULL,NULL,false,NULL),
('caixa-de-ferramentas','Caixa de ferramentas','Ferramentas e construção',3,12,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pedra-de-amolar','Pedra de amolar','Ferramentas e construção',3,13,false,false,false,true,'un',1,NULL,NULL,3,false,NULL),
('oleo-de-manutencao','Óleo de manutenção','Ferramentas e construção',3,14,true,false,false,false,'ml',250,NULL,NULL,NULL,false,NULL),
('mapa','Mapa','Exploração e orientação',4,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('bussola','Bússola','Exploração e orientação',4,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('ampulheta','Ampulheta','Exploração e orientação',4,3,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('giz','Giz','Exploração e orientação',4,4,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('carvao','Carvão','Exploração e orientação',4,5,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('vara-de-exploracao','Vara de exploração','Exploração e orientação',4,6,false,false,false,true,'un',1,NULL,NULL,3,true,'Sondar profundidade, terreno instável, buracos, armadilhas simples e travessias.'),
('barraca','Barraca','Acampamento e viagem',5,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('lona','Lona','Acampamento e viagem',5,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('manta','Manta','Acampamento e viagem',5,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('esteira','Esteira','Acampamento e viagem',5,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('capa-de-viagem','Capa de viagem','Acampamento e viagem',5,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('mochila','Mochila','Acampamento e viagem',5,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('bolsa','Bolsa','Acampamento e viagem',5,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('saco-de-lona','Saco de lona','Acampamento e viagem',5,8,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('cesta','Cesta','Acampamento e viagem',5,9,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('bau','Baú','Acampamento e viagem',5,10,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frasco-pequeno','Frasco pequeno','Água e recipientes',6,1,false,false,true,true,'un',1,100,NULL,2,false,NULL),
('garrafa','Garrafa','Água e recipientes',6,2,false,false,true,true,'un',1,500,NULL,2,false,NULL),
('cantil','Cantil','Água e recipientes',6,3,false,false,true,true,'un',1,1000,NULL,3,true,NULL),
('cantil-grande','Cantil grande','Água e recipientes',6,4,false,false,true,true,'un',1,2000,NULL,3,true,NULL),
('odre','Odre','Água e recipientes',6,5,false,false,true,true,'un',1,4000,NULL,3,true,NULL),
('odre-grande','Odre grande','Água e recipientes',6,6,false,false,true,true,'un',1,8000,NULL,3,true,NULL),
('jarro','Jarro','Água e recipientes',6,7,false,false,true,true,'un',1,2000,NULL,2,true,NULL),
('balde','Balde','Água e recipientes',6,8,false,false,true,true,'un',1,10000,NULL,4,true,NULL),
('barrilete','Barrilete','Água e recipientes',6,9,false,false,true,true,'un',1,20000,NULL,4,true,NULL),
('barril','Barril','Água e recipientes',6,10,false,false,true,true,'un',1,50000,NULL,5,true,NULL),
('pao-seco','Pão seco','Alimentos secos e duráveis',7,1,true,true,false,false,'g',500,NULL,20160,NULL,false,NULL),
('biscoito-de-viagem','Biscoito de viagem','Alimentos secos e duráveis',7,2,true,true,false,false,'g',500,NULL,129600,NULL,false,NULL),
('frutas-secas','Frutas secas','Alimentos secos e duráveis',7,3,true,true,false,false,'g',250,NULL,86400,NULL,false,NULL),
('nozes-e-castanhas','Nozes e castanhas','Alimentos secos e duráveis',7,4,true,true,false,false,'g',250,NULL,43200,NULL,false,NULL),
('graos-secos','Grãos secos','Alimentos secos e duráveis',7,5,true,true,false,false,'g',500,NULL,259200,NULL,false,NULL),
('leguminosas-secas','Leguminosas secas','Alimentos secos e duráveis',7,6,true,true,false,false,'g',500,NULL,259200,NULL,false,NULL),
('farinha','Farinha','Alimentos secos e duráveis',7,7,true,true,false,false,'g',1000,NULL,129600,NULL,false,NULL),
('sal','Sal','Alimentos secos e duráveis',7,8,true,false,false,false,'g',250,NULL,NULL,NULL,false,'Não estraga em condições normais.'),
('mel','Mel','Alimentos secos e duráveis',7,9,true,false,false,false,'g',250,NULL,NULL,NULL,false,'Não estraga em condições normais.'),
('carne-seca','Carne seca','Carnes e pescados conservados',8,1,true,true,false,false,'g',500,NULL,86400,NULL,false,NULL),
('carne-salgada','Carne salgada','Carnes e pescados conservados',8,2,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('carne-defumada','Carne defumada','Carnes e pescados conservados',8,3,true,true,false,false,'g',500,NULL,28800,NULL,false,NULL),
('linguica-curada','Linguiça curada','Carnes e pescados conservados',8,4,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('peixe-seco','Peixe seco','Carnes e pescados conservados',8,5,true,true,false,false,'g',500,NULL,64800,NULL,false,NULL),
('peixe-salgado','Peixe salgado','Carnes e pescados conservados',8,6,true,true,false,false,'g',500,NULL,28800,NULL,false,NULL),
('peixe-defumado','Peixe defumado','Carnes e pescados conservados',8,7,true,true,false,false,'g',500,NULL,14400,NULL,false,NULL),
('queijo-fresco','Queijo fresco','Laticínios',9,1,true,true,false,false,'g',500,NULL,4320,NULL,false,NULL),
('queijo-curado','Queijo curado','Laticínios',9,2,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('queijo-duro','Queijo duro','Laticínios',9,3,true,true,false,false,'g',500,NULL,86400,NULL,false,NULL),
('manteiga','Manteiga','Laticínios',9,4,true,true,false,false,'g',250,NULL,10080,NULL,false,NULL),
('manteiga-clarificada','Manteiga clarificada','Laticínios',9,5,true,true,false,false,'g',250,NULL,43200,NULL,false,NULL),
('frutas-frescas','Frutas frescas','Alimentos frescos',10,1,true,true,false,false,'g',500,NULL,7200,NULL,false,NULL),
('legumes','Legumes','Alimentos frescos',10,2,true,true,false,false,'g',500,NULL,10080,NULL,false,NULL),
('verduras','Verduras','Alimentos frescos',10,3,true,true,false,false,'g',500,NULL,4320,NULL,false,NULL),
('raizes-e-tuberculos','Raízes e tubérculos','Alimentos frescos',10,4,true,true,false,false,'g',1000,NULL,20160,NULL,false,NULL),
('cogumelos','Cogumelos','Alimentos frescos',10,5,true,true,false,false,'g',250,NULL,2880,NULL,false,NULL),
('ovos','Ovos','Alimentos frescos',10,6,true,true,false,false,'un',6,NULL,20160,NULL,false,NULL),
('panela','Panela','Cozinha',11,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frigideira','Frigideira','Cozinha',11,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('caneca','Caneca','Cozinha',11,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('tigela','Tigela','Cozinha',11,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('colher','Colher','Cozinha',11,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('faca-utilitaria','Faca utilitária','Cozinha',11,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('espeto','Espeto','Cozinha',11,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('grelha-pequena','Grelha pequena','Cozinha',11,8,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('rede','Rede','Caça, pesca e coleta',12,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('armadilha-pequena','Armadilha pequena','Caça, pesca e coleta',12,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('linha-de-pesca','Linha de pesca','Caça, pesca e coleta',12,3,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('anzol','Anzol','Caça, pesca e coleta',12,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('faca-de-caca','Faca de caça','Caça, pesca e coleta',12,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('saco-de-coleta','Saco de coleta','Caça, pesca e coleta',12,6,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('ataduras','Ataduras','Medicina',13,1,true,false,false,false,'un',5,NULL,NULL,NULL,false,NULL),
('tala','Tala','Medicina',13,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pano-limpo','Pano limpo','Medicina',13,3,true,false,false,false,'un',5,NULL,NULL,NULL,false,NULL),
('instrumentos-cirurgicos','Instrumentos cirúrgicos','Medicina',13,4,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('alcool-medicinal','Álcool medicinal','Medicina',13,5,true,false,false,false,'ml',250,NULL,NULL,NULL,false,NULL),
('sabao','Sabão','Medicina',13,6,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('agulha-e-linha','Agulha e linha','Medicina',13,7,true,false,false,false,'conjunto',1,NULL,NULL,NULL,false,NULL),
('almofariz-e-pilao','Almofariz e pilão','Alquimia',14,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frasco','Frasco','Alquimia',14,2,false,false,true,true,'un',1,250,NULL,2,false,NULL),
('tubo-de-vidro','Tubo de vidro','Alquimia',14,3,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('funil','Funil','Alquimia',14,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('alambique-portatil','Alambique portátil','Alquimia',14,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('balanca-de-precisao','Balança de precisão','Alquimia',14,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('colher-de-medida','Colher de medida','Alquimia',14,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('recipiente-de-mistura','Recipiente de mistura','Alquimia',14,8,false,false,true,true,'un',1,1000,NULL,3,true,NULL),
('pena','Pena','Escrita e registro',15,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('tinteiro','Tinteiro','Escrita e registro',15,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pergaminho','Pergaminho','Escrita e registro',15,3,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('papel','Papel','Escrita e registro',15,4,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('caderno','Caderno','Escrita e registro',15,5,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('codice','Códice','Escrita e registro',15,6,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('lacre','Lacre','Escrita e registro',15,7,false,false,false,true,'un',1,NULL,NULL,3,false,NULL),
('cera-de-selo','Cera de selo','Escrita e registro',15,8,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('balanca-mercantil','Balança mercantil','Comércio e administração',16,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('pesos-de-medida','Pesos de medida','Comércio e administração',16,2,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('abaco','Ábaco','Comércio e administração',16,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('bolsa-de-moedas','Bolsa de moedas','Comércio e administração',16,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('livro-caixa','Livro-caixa','Comércio e administração',16,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('baralho','Baralho','Trapaça, jogos e prestidigitação',17,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('dados','Dados','Trapaça, jogos e prestidigitação',17,2,false,false,false,true,'conjunto',1,NULL,NULL,3,false,NULL),
('copo-de-dados','Copo de dados','Trapaça, jogos e prestidigitação',17,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('moeda-manipulavel','Moeda manipulável','Trapaça, jogos e prestidigitação',17,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('lenco','Lenço','Trapaça, jogos e prestidigitação',17,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('pequenas-bolas-de-prestidigitacao','Pequenas bolas de prestidigitação','Trapaça, jogos e prestidigitação',17,6,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('kit-de-maquiagem-cenica','Kit de maquiagem cênica','Disfarce, etiqueta e interpretação',18,1,true,false,false,false,'kit',1,NULL,NULL,NULL,false,NULL),
('peruca','Peruca','Disfarce, etiqueta e interpretação',18,2,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('mascara','Máscara','Disfarce, etiqueta e interpretação',18,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('disfarce','Disfarce','Disfarce, etiqueta e interpretação',18,4,false,false,false,true,'conjunto',1,NULL,NULL,2,true,NULL),
('traje-comum','Traje comum','Disfarce, etiqueta e interpretação',18,5,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('traje-refinado','Traje refinado','Disfarce, etiqueta e interpretação',18,6,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('traje-cerimonial','Traje cerimonial','Disfarce, etiqueta e interpretação',18,7,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('instrumento-musical','Instrumento musical','Arte e expressão',19,1,false,false,false,true,'un',1,NULL,NULL,3,true,'Defina o instrumento na descrição: flauta, alaúde, tambor, lira etc.'),
('tela','Tela','Arte e expressão',19,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pergaminho-para-desenho','Pergaminho para desenho','Arte e expressão',19,3,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('pinceis','Pincéis','Arte e expressão',19,4,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('pigmentos','Pigmentos','Arte e expressão',19,5,true,false,false,false,'conjunto',1,NULL,NULL,NULL,false,NULL),
('carvao-artistico','Carvão artístico','Arte e expressão',19,6,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('material-de-escultura','Material de escultura','Arte e expressão',19,7,true,false,false,false,'porção',1,NULL,NULL,NULL,false,NULL),
('sela','Sela','Cavalaria e animais',20,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('redeas','Rédeas','Cavalaria e animais',20,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('arreios','Arreios','Cavalaria e animais',20,3,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('alforje','Alforje','Cavalaria e animais',20,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('ferraduras','Ferraduras','Cavalaria e animais',20,5,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('escova-para-animal','Escova para animal','Cavalaria e animais',20,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('racao-animal','Ração animal','Cavalaria e animais',20,7,true,true,false,false,'kg',1,NULL,129600,NULL,false,NULL),
('corda-de-conducao','Corda de condução','Cavalaria e animais',20,8,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('sino-para-animal','Sino para animal','Cavalaria e animais',20,9,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('sino','Sino','Sinalização e comunicação',21,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('espelho-de-sinalizacao','Espelho de sinalização','Sinalização e comunicação',21,2,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('bandeira','Bandeira','Sinalização e comunicação',21,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('corneta','Corneta','Sinalização e comunicação',21,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('apito','Apito','Sinalização e comunicação',21,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('barbante','Barbante','Itens gerais e pequenos',22,1,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('cera','Cera','Itens gerais e pequenos',22,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('cola','Cola','Itens gerais e pequenos',22,3,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pano','Pano','Itens gerais e pequenos',22,4,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('saco-pequeno','Saco pequeno','Itens gerais e pequenos',22,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('caixa-pequena','Caixa pequena','Itens gerais e pequenos',22,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('agulha','Agulha','Itens gerais e pequenos',22,7,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('linha','Linha','Itens gerais e pequenos',22,8,true,false,false,false,'m',10,NULL,NULL,NULL,false,NULL),
('rolha','Rolha','Itens gerais e pequenos',22,9,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('correia-de-couro','Correia de couro','Itens gerais e pequenos',22,10,false,false,false,true,'un',1,NULL,NULL,3,true,NULL)
ON CONFLICT (id) DO UPDATE SET
 name=EXCLUDED.name, category=EXCLUDED.category, category_order=EXCLUDED.category_order,
 sort_order=EXCLUDED.sort_order, is_consumable=EXCLUDED.is_consumable,
 is_perishable=EXCLUDED.is_perishable, is_container=EXCLUDED.is_container,
 is_durable=EXCLUDED.is_durable, unit=EXCLUDED.unit, default_amount=EXCLUDED.default_amount,
 capacity_ml=EXCLUDED.capacity_ml, shelf_life_minutes=EXCLUDED.shelf_life_minutes,
 durability_max=EXCLUDED.durability_max, repairable=EXCLUDED.repairable,
 notes=EXCLUDED.notes, updated_at=now();

CREATE OR REPLACE VIEW item_catalog_public AS
SELECT id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,
       unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes
FROM item_catalog ORDER BY category_order,sort_order,name;
GRANT SELECT ON item_catalog_public TO anon, authenticated;

-- ============================================================
-- 2) INSTÂNCIAS / LOTES NO INVENTÁRIO
-- ============================================================
ALTER TABLE character_items
  ADD COLUMN IF NOT EXISTS catalog_item_id text REFERENCES item_catalog(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS capacity_ml integer,
  ADD COLUMN IF NOT EXISTS durability_current integer,
  ADD COLUMN IF NOT EXISTS durability_max integer,
  ADD COLUMN IF NOT EXISTS freshness_minutes_remaining bigint,
  ADD COLUMN IF NOT EXISTS shelf_life_multiplier numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acquired_at timestamptz NOT NULL DEFAULT now();

-- Equipamentos oficiais também participam da durabilidade universal.
UPDATE character_items SET
  durability_max=COALESCE(durability_max,4),
  durability_current=COALESCE(durability_current,4),
  properties=COALESCE(properties,'{}'::jsonb)||jsonb_build_object('durable',true,'repairable',true)
WHERE weapon_id IS NOT NULL OR armor_id IS NOT NULL OR shield_id IS NOT NULL;

-- Recria a inclusão manual/oficial para que novas armas, armaduras e escudos já nasçam com durabilidade 4/4.
CREATE OR REPLACE FUNCTION master_add_character_item(
  p_master_player_id uuid,
  p_character_id uuid,
  p_name text DEFAULT NULL,
  p_type text DEFAULT 'comum',
  p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,
  p_weapon_id text DEFAULT NULL,
  p_armor_id text DEFAULT NULL,
  p_shield_id text DEFAULT NULL,
  p_hunger_restore integer DEFAULT 0,
  p_thirst_restore integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_name text; v_type text; v_durability integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.'; END IF;
  IF p_weapon_id IS NOT NULL THEN SELECT name INTO v_name FROM weapons WHERE id=p_weapon_id; v_type:='arma'; v_durability:=4;
  ELSIF p_armor_id IS NOT NULL THEN SELECT name INTO v_name FROM armors WHERE id=p_armor_id; v_type:='armadura'; v_durability:=4;
  ELSIF p_shield_id IS NOT NULL THEN SELECT name INTO v_name FROM shields WHERE id=p_shield_id; v_type:='escudo'; v_durability:=4;
  ELSE v_name:=NULLIF(trim(p_name),''); v_type:=COALESCE(NULLIF(trim(p_type),''),'comum'); v_durability:=NULL; END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Item inválido.'; END IF;
  INSERT INTO character_items(character_id,name,type,quantity,equipped,description,weapon_id,armor_id,shield_id,equip_slot,properties,durability_current,durability_max)
  VALUES(p_character_id,v_name,v_type,GREATEST(1,COALESCE(p_quantity,1)),false,p_description,p_weapon_id,p_armor_id,p_shield_id,NULL,
    jsonb_build_object('hunger_restore',GREATEST(0,COALESCE(p_hunger_restore,0)),'thirst_restore',GREATEST(0,COALESCE(p_thirst_restore,0)),'durable',v_durability IS NOT NULL,'repairable',v_durability IS NOT NULL),
    v_durability,v_durability)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS character_items_catalog_item_idx ON character_items(catalog_item_id);
ALTER TABLE character_items DROP CONSTRAINT IF EXISTS character_items_shelf_life_multiplier_check;
ALTER TABLE character_items ADD CONSTRAINT character_items_shelf_life_multiplier_check CHECK (shelf_life_multiplier > 0);
ALTER TABLE character_items DROP CONSTRAINT IF EXISTS character_items_durability_current_check;
ALTER TABLE character_items ADD CONSTRAINT character_items_durability_current_check CHECK (durability_current IS NULL OR durability_current >= 0);

-- Cada chamada cria uma nova linha: perecíveis de datas diferentes permanecem como lotes distintos.
CREATE OR REPLACE FUNCTION master_add_catalog_item(
  p_master_player_id uuid,
  p_character_id uuid,
  p_catalog_item_id text,
  p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,
  p_shelf_life_multiplier numeric DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v item_catalog%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.';
  END IF;
  SELECT * INTO v FROM item_catalog WHERE id=p_catalog_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item do catálogo não encontrado.'; END IF;
  INSERT INTO character_items(
    character_id,name,type,quantity,equipped,description,equip_slot,properties,
    catalog_item_id,unit,amount,capacity_ml,durability_current,durability_max,
    freshness_minutes_remaining,shelf_life_multiplier
  ) VALUES (
    p_character_id,v.name,
    CASE WHEN v.is_perishable THEN 'perecível' WHEN v.is_consumable THEN 'consumível' WHEN v.is_container THEN 'recipiente' ELSE 'comum' END,
    GREATEST(1,COALESCE(p_quantity,1)),false,COALESCE(p_description,v.notes),NULL,
    jsonb_build_object(
      'consumable',v.is_consumable,'perishable',v.is_perishable,'container',v.is_container,'durable',v.is_durable,
      'repairable',v.repairable,'shelf_life_minutes',v.shelf_life_minutes,'hunger_restore',0,'thirst_restore',0
    ),
    v.id,v.unit,v.default_amount,v.capacity_ml,v.durability_max,v.durability_max,
    v.shelf_life_minutes,GREATEST(0.1,COALESCE(p_shelf_life_multiplier,1))
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_catalog_item(uuid,uuid,text,integer,text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_catalog_item(uuid,uuid,text,integer,text,numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION master_update_character_item_state(
  p_master_player_id uuid,
  p_item_id uuid,
  p_quantity integer DEFAULT NULL,
  p_durability_current integer DEFAULT NULL,
  p_shelf_life_multiplier numeric DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v character_items%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Apenas o Mestre pode editar itens.';
  END IF;
  SELECT * INTO v FROM character_items WHERE id=p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
  UPDATE character_items SET
    quantity=CASE WHEN p_quantity IS NULL THEN quantity ELSE GREATEST(0,p_quantity) END,
    durability_current=CASE WHEN durability_max IS NULL THEN NULL WHEN p_durability_current IS NULL THEN durability_current ELSE LEAST(durability_max,GREATEST(0,p_durability_current)) END,
    shelf_life_multiplier=CASE WHEN p_shelf_life_multiplier IS NULL THEN shelf_life_multiplier ELSE GREATEST(0.1,p_shelf_life_multiplier) END,
    description=COALESCE(p_description,description)
  WHERE id=p_item_id;
  UPDATE character_items SET equip_slot=NULL,equipped=false WHERE id=p_item_id AND durability_current=0;
END $$;
REVOKE ALL ON FUNCTION master_update_character_item_state(uuid,uuid,integer,integer,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_update_character_item_state(uuid,uuid,integer,integer,numeric,text) TO anon, authenticated;

-- Não permite equipar um objeto quebrado.
CREATE OR REPLACE FUNCTION set_character_item_slot(p_player_id uuid,p_character_id uuid,p_item_id uuid,p_slot text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
  IF COALESCE(v_item.durability_current,1)=0 THEN RAISE EXCEPTION 'Este item está quebrado.'; END IF;
  IF p_slot IS NOT NULL AND p_slot NOT IN ('weapon','armor','shield','hand1','hand2') THEN RAISE EXCEPTION 'Slot inválido.'; END IF;
  IF p_slot='weapon' AND v_item.weapon_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma arma do catálogo.'; END IF;
  IF p_slot='armor' AND v_item.armor_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma armadura do catálogo.'; END IF;
  IF p_slot='shield' AND v_item.shield_id IS NULL THEN RAISE EXCEPTION 'Este item não é um escudo do catálogo.'; END IF;
  IF p_slot IS NOT NULL THEN UPDATE character_items SET equip_slot=NULL,equipped=false WHERE character_id=p_character_id AND equip_slot=p_slot AND id<>p_item_id; END IF;
  UPDATE character_items SET equip_slot=p_slot,equipped=(p_slot IS NOT NULL) WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) TO anon, authenticated;

-- ============================================================
-- 3) RELÓGIO CENTRAL, FOME/SEDE EM MINUTOS E EFEITOS TEMPORÁRIOS
-- ============================================================
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS hunger_minutes_remainder integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thirst_minutes_remainder integer NOT NULL DEFAULT 0;
UPDATE characters SET
  hunger_minutes_remainder=GREATEST(hunger_minutes_remainder,COALESCE(hunger_hours_remainder,0)*60),
  thirst_minutes_remainder=GREATEST(thirst_minutes_remainder,COALESCE(thirst_hours_remainder,0)*60);

ALTER TABLE character_conditions ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE character_effects
  ADD COLUMN IF NOT EXISTS remaining_minutes bigint,
  ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS trilha_world_clock (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id=1),
  elapsed_minutes bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO trilha_world_clock(id,elapsed_minutes) VALUES(1,0) ON CONFLICT(id) DO NOTHING;
GRANT SELECT ON trilha_world_clock TO anon, authenticated;

CREATE TABLE IF NOT EXISTS trilha_time_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_player_id uuid NOT NULL,
  minutes integer NOT NULL CHECK (minutes>0),
  rest_type text CHECK (rest_type IS NULL OR rest_type IN ('short','long')),
  snapshot jsonb NOT NULL,
  undone boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE trilha_time_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON trilha_time_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION trilha_sync_survival_condition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='vivo' AND (COALESCE(NEW.current_hunger,0)=0 OR COALESCE(NEW.current_thirst,0)=0) THEN
    IF NOT EXISTS(SELECT 1 FROM character_conditions WHERE character_id=NEW.id AND source='survival') THEN
      INSERT INTO character_conditions(character_id,condition,intensity,duration,notes,source)
      VALUES(NEW.id,'Desmaiado',NULL,'Até ser recuperado',
        CASE WHEN COALESCE(NEW.current_hunger,0)=0 AND COALESCE(NEW.current_thirst,0)=0 THEN 'Fome e sede chegaram a 0.' WHEN COALESCE(NEW.current_hunger,0)=0 THEN 'Fome chegou a 0.' ELSE 'Sede chegou a 0.' END,
        'survival');
    ELSE
      UPDATE character_conditions SET notes=CASE WHEN COALESCE(NEW.current_hunger,0)=0 AND COALESCE(NEW.current_thirst,0)=0 THEN 'Fome e sede chegaram a 0.' WHEN COALESCE(NEW.current_hunger,0)=0 THEN 'Fome chegou a 0.' ELSE 'Sede chegou a 0.' END WHERE character_id=NEW.id AND source='survival';
    END IF;
  ELSE
    DELETE FROM character_conditions WHERE character_id=NEW.id AND source='survival';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_trilha_survival_condition ON characters;
CREATE TRIGGER trg_trilha_survival_condition AFTER INSERT OR UPDATE OF current_hunger,current_thirst,status ON characters
FOR EACH ROW EXECUTE FUNCTION trilha_sync_survival_condition();

CREATE OR REPLACE FUNCTION master_advance_time(p_master_player_id uuid,p_minutes integer,p_rest_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r record; v_hunger_max integer; v_hunger integer; v_thirst integer; v_ht integer; v_tt integer;
  v_vigor integer; v_mental integer; v_mystical integer; v_hpmax integer; v_mpmax integer; v_hp integer; v_mp integer;
  v_before_hunger integer; v_before_thirst integer; v_before_hp integer; v_before_mp integer;
  v_characters jsonb:='[]'::jsonb; v_snapshot jsonb; v_effects_expired integer:=0; v_items_spoiled integer:=0; v_event_id uuid;
BEGIN
  IF p_minutes IS NULL OR p_minutes<=0 THEN RAISE EXCEPTION 'Informe uma passagem de tempo positiva.'; END IF;
  IF p_rest_type IS NOT NULL AND p_rest_type NOT IN ('short','long') THEN RAISE EXCEPTION 'Tipo de descanso inválido.'; END IF;
  IF p_rest_type='short' AND p_minutes<>240 THEN RAISE EXCEPTION 'Descanso curto deve avançar 4 horas.'; END IF;
  IF p_rest_type='long' AND p_minutes<>480 THEN RAISE EXCEPTION 'Descanso longo deve avançar 8 horas.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre controla a passagem do tempo.'; END IF;

  SELECT jsonb_build_object(
    'clock',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1),
    'characters',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'current_hp',current_hp,'current_mp',current_mp,'current_hunger',current_hunger,'current_thirst',current_thirst,'hunger_minutes_remainder',hunger_minutes_remainder,'thirst_minutes_remainder',thirst_minutes_remainder,'hunger_hours_remainder',hunger_hours_remainder,'thirst_hours_remainder',thirst_hours_remainder)),'[]'::jsonb) FROM characters WHERE status='vivo'),
    'effects',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'remaining_minutes',remaining_minutes,'active',active)),'[]'::jsonb) FROM character_effects WHERE active=true),
    'items',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'freshness_minutes_remaining',freshness_minutes_remaining)),'[]'::jsonb) FROM character_items WHERE freshness_minutes_remaining IS NOT NULL),
    'survival_conditions',(SELECT COALESCE(jsonb_agg(jsonb_build_object('character_id',character_id,'condition',condition,'intensity',intensity,'duration',duration,'notes',notes,'source',source)),'[]'::jsonb) FROM character_conditions WHERE source='survival')
  ) INTO v_snapshot;

  FOR r IN SELECT * FROM characters WHERE status='vivo' FOR UPDATE LOOP
    v_vigor:=COALESCE((r.attributes->>'Vigor')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Vigor')::integer,0);
    v_hunger_max:=GREATEST(1,9-v_vigor);
    v_before_hunger:=LEAST(COALESCE(r.current_hunger,v_hunger_max),v_hunger_max);
    v_before_thirst:=LEAST(COALESCE(r.current_thirst,6),6);
    v_before_hp:=COALESCE(r.current_hp,15+v_vigor*5+(GREATEST(1,r.level)-1)*2);

    v_mental:=GREATEST(
      COALESCE((r.attributes->>'Inteligência')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Inteligência')::integer,0),
      COALESCE((r.attributes->>'Raciocínio')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Raciocínio')::integer,0),
      COALESCE((r.attributes->>'Sabedoria')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Sabedoria')::integer,0),
      COALESCE((r.attributes->>'Percepção')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Percepção')::integer,0)
    );
    v_mystical:=GREATEST(
      COALESCE((r.skills->>'Elementalismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Elementalismo')::integer,0),
      COALESCE((r.skills->>'Arcanismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Arcanismo')::integer,0),
      COALESCE((r.skills->>'Ritualismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Ritualismo')::integer,0),
      COALESCE((r.skills->>'Manipulação Arcana')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Manipulação Arcana')::integer,0),
      COALESCE((r.skills->>'Teologia')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Teologia')::integer,0),
      COALESCE((r.skills->>'Espiritualismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Espiritualismo')::integer,0)
    );
    v_hpmax:=15+v_vigor*5+(GREATEST(1,r.level)-1)*2;
    v_mpmax:=CASE WHEN v_mystical>0 THEN 5+v_mental*2+v_mystical*2+GREATEST(1,r.level) ELSE 0 END;
    v_before_mp:=COALESCE(r.current_mp,v_mpmax);

    v_ht:=COALESCE(r.hunger_minutes_remainder,COALESCE(r.hunger_hours_remainder,0)*60)+p_minutes;
    v_tt:=COALESCE(r.thirst_minutes_remainder,COALESCE(r.thirst_hours_remainder,0)*60)+p_minutes;
    v_hunger:=GREATEST(0,v_before_hunger-(v_ht/480));
    v_thirst:=GREATEST(0,v_before_thirst-(v_tt/360));
    v_hp:=v_before_hp; v_mp:=v_before_mp;
    IF p_rest_type='short' THEN
      v_hp:=LEAST(v_hpmax,v_hp+v_vigor*2);
      v_mp:=LEAST(v_mpmax,v_mp+v_mental*2);
    ELSIF p_rest_type='long' THEN
      v_hp:=v_hpmax; v_mp:=v_mpmax;
    END IF;

    UPDATE characters SET current_hunger=v_hunger,current_thirst=v_thirst,
      hunger_minutes_remainder=MOD(v_ht,480),thirst_minutes_remainder=MOD(v_tt,360),
      hunger_hours_remainder=MOD(v_ht,480)/60,thirst_hours_remainder=MOD(v_tt,360)/60,
      current_hp=v_hp,current_mp=v_mp WHERE id=r.id;

    v_characters:=v_characters||jsonb_build_array(jsonb_build_object(
      'id',r.id,'name',r.name,'hunger_before',v_before_hunger,'hunger_after',v_hunger,
      'thirst_before',v_before_thirst,'thirst_after',v_thirst,'hp_before',v_before_hp,'hp_after',v_hp,
      'mp_before',v_before_mp,'mp_after',v_mp
    ));
  END LOOP;

  UPDATE character_effects SET
    remaining_minutes=GREATEST(0,remaining_minutes-p_minutes),
    active=(remaining_minutes-p_minutes)>0
  WHERE active=true AND is_permanent=false AND remaining_minutes IS NOT NULL;
  SELECT count(*) INTO v_effects_expired FROM character_effects WHERE active=false AND is_permanent=false AND remaining_minutes=0 AND id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'effects') x WHERE COALESCE((x->>'active')::boolean,false)=true);

  UPDATE character_items SET freshness_minutes_remaining=GREATEST(0,
    freshness_minutes_remaining-CEIL(p_minutes/GREATEST(0.1,shelf_life_multiplier))::bigint)
  WHERE freshness_minutes_remaining IS NOT NULL AND freshness_minutes_remaining>0;
  SELECT count(*) INTO v_items_spoiled FROM character_items ci
    WHERE ci.freshness_minutes_remaining=0 AND ci.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'items') x WHERE COALESCE((x->>'freshness_minutes_remaining')::bigint,0)>0);

  UPDATE trilha_world_clock SET elapsed_minutes=elapsed_minutes+p_minutes,updated_at=now() WHERE id=1;
  INSERT INTO trilha_time_events(master_player_id,minutes,rest_type,snapshot) VALUES(p_master_player_id,p_minutes,p_rest_type,v_snapshot) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('event_id',v_event_id,'minutes',p_minutes,'rest_type',p_rest_type,'characters',v_characters,'effects_expired',v_effects_expired,'items_spoiled',v_items_spoiled,'elapsed_minutes',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1));
END $$;
REVOKE ALL ON FUNCTION master_advance_time(uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_advance_time(uuid,integer,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION undo_last_time_advance(p_master_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e trilha_time_events%ROWTYPE; x jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode desfazer o tempo.'; END IF;
  SELECT * INTO e FROM trilha_time_events WHERE undone=false ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não há avanço de tempo para desfazer.'; END IF;

  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'characters') LOOP
    UPDATE characters SET current_hp=(x->>'current_hp')::integer,current_mp=(x->>'current_mp')::integer,
      current_hunger=(x->>'current_hunger')::integer,current_thirst=(x->>'current_thirst')::integer,
      hunger_minutes_remainder=COALESCE((x->>'hunger_minutes_remainder')::integer,0),thirst_minutes_remainder=COALESCE((x->>'thirst_minutes_remainder')::integer,0),
      hunger_hours_remainder=COALESCE((x->>'hunger_hours_remainder')::integer,0),thirst_hours_remainder=COALESCE((x->>'thirst_hours_remainder')::integer,0)
    WHERE id=(x->>'id')::uuid;
  END LOOP;
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'effects') LOOP
    UPDATE character_effects SET remaining_minutes=NULLIF(x->>'remaining_minutes','')::bigint,active=COALESCE((x->>'active')::boolean,true) WHERE id=(x->>'id')::uuid;
  END LOOP;
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'items') LOOP
    UPDATE character_items SET freshness_minutes_remaining=NULLIF(x->>'freshness_minutes_remaining','')::bigint WHERE id=(x->>'id')::uuid;
  END LOOP;
  DELETE FROM character_conditions WHERE source='survival';
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'survival_conditions') LOOP
    INSERT INTO character_conditions(character_id,condition,intensity,duration,notes,source)
    VALUES((x->>'character_id')::uuid,x->>'condition',NULLIF(x->>'intensity','')::integer,x->>'duration',x->>'notes',x->>'source');
  END LOOP;
  UPDATE trilha_world_clock SET elapsed_minutes=GREATEST(0,COALESCE((e.snapshot->>'clock')::bigint,0)),updated_at=now() WHERE id=1;
  UPDATE trilha_time_events SET undone=true WHERE id=e.id;
  RETURN jsonb_build_object('event_id',e.id,'minutes',e.minutes,'rest_type',e.rest_type,'elapsed_minutes',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1));
END $$;
REVOKE ALL ON FUNCTION undo_last_time_advance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION undo_last_time_advance(uuid) TO anon, authenticated;

-- Consumir item estragado não concede recuperação automática; pode ser tratado narrativamente pelo Mestre.
CREATE OR REPLACE FUNCTION consume_character_item(p_player_id uuid,p_character_id uuid,p_item_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_hunger_restore integer; v_thirst_restore integer; v_hunger_max integer; v_is_master boolean; v_new_hunger integer; v_new_thirst integer;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id FOR UPDATE;
  IF NOT FOUND OR v_item.quantity<=0 THEN RAISE EXCEPTION 'Consumível indisponível.'; END IF;
  IF v_item.freshness_minutes_remaining IS NOT NULL AND v_item.freshness_minutes_remaining<=0 THEN RAISE EXCEPTION 'Este alimento está estragado. O Mestre decide os efeitos de consumi-lo.'; END IF;
  v_hunger_restore:=GREATEST(0,COALESCE((v_item.properties->>'hunger_restore')::integer,0));
  v_thirst_restore:=GREATEST(0,COALESCE((v_item.properties->>'thirst_restore')::integer,0));
  IF v_hunger_restore=0 AND v_thirst_restore=0 THEN RAISE EXCEPTION 'Este item ainda não possui recuperação de Fome ou Sede definida.'; END IF;
  SELECT GREATEST(1,9-(COALESCE((attributes->>'Vigor')::integer,0)+COALESCE((racial_attribute_bonus->>'Vigor')::integer,0))),COALESCE(current_hunger,0),COALESCE(current_thirst,0)
    INTO v_hunger_max,v_new_hunger,v_new_thirst FROM characters WHERE id=p_character_id FOR UPDATE;
  v_new_hunger:=LEAST(v_hunger_max,v_new_hunger+v_hunger_restore); v_new_thirst:=LEAST(6,v_new_thirst+v_thirst_restore);
  UPDATE characters SET current_hunger=v_new_hunger,current_thirst=v_new_thirst WHERE id=p_character_id;
  IF v_item.quantity<=1 THEN DELETE FROM character_items WHERE id=p_item_id; ELSE UPDATE character_items SET quantity=quantity-1 WHERE id=p_item_id; END IF;
END $$;
REVOKE ALL ON FUNCTION consume_character_item(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_character_item(uuid,uuid,uuid) TO anon, authenticated;

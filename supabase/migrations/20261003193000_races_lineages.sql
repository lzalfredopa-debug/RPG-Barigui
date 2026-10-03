CREATE TABLE IF NOT EXISTS races (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  attribute_mode text NOT NULL CHECK (attribute_mode IN ('any','physical','mental','social','fixed')),
  fixed_attribute text
);
CREATE TABLE IF NOT EXISTS lineages (
  id text PRIMARY KEY,
  race_id text NOT NULL REFERENCES races(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  skill_group_1 text NOT NULL,
  skill_group_2 text NOT NULL
);
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS races_select ON races; CREATE POLICY races_select ON races FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS races_update ON races; CREATE POLICY races_update ON races FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS lineages_select ON lineages; CREATE POLICY lineages_select ON lineages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS lineages_update ON lineages; CREATE POLICY lineages_update ON lineages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id,name,public) VALUES ('ancestry-images','ancestry-images',true) ON CONFLICT (id) DO UPDATE SET public=true;
DROP POLICY IF EXISTS ancestry_images_select ON storage.objects; CREATE POLICY ancestry_images_select ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id='ancestry-images');
DROP POLICY IF EXISTS ancestry_images_insert ON storage.objects; CREATE POLICY ancestry_images_insert ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id='ancestry-images');
DROP POLICY IF EXISTS ancestry_images_update ON storage.objects; CREATE POLICY ancestry_images_update ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id='ancestry-images') WITH CHECK (bucket_id='ancestry-images');

ALTER TABLE characters ADD COLUMN IF NOT EXISTS racial_attribute_bonus jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS lineage_skill_bonuses jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO races(id,name,description,image_url,attribute_mode,fixed_attribute) VALUES
('humanos','Humanos','Adaptáveis e diversos, os humanos prosperam nos mais diferentes ambientes e sociedades.','/images/linhagens/humanos-terrano.png','any',NULL),
('elfos','Elfos','Povos longevos de tradições refinadas, marcados por diferentes relações com o mundo natural, o céu e as profundezas.','/images/linhagens/elfos-silvestre.png','mental',NULL),
('anoes','Anões','Povos robustos de constituição resistente, ligados a antigas tradições de montanha, pedra e ofício.','/images/linhagens/anoes-granitico.png','fixed','Vigor'),
('orcs','Orcs','Povos de grande potência física, moldados por comunidades e ambientes diversos.','/images/linhagens/orcs-colossal.png','fixed','Força'),
('pequeninos','Pequeninos','Povos de pequena estatura, ágeis e adaptados a diferentes paisagens e modos de vida.','/images/linhagens/pequeninos-campestre.png','fixed','Agilidade'),
('goblins','Goblins','Povos engenhosos e habilidosos, conhecidos pela precisão manual e adaptação a ambientes incomuns.','/images/linhagens/goblins-cavernicola.png','fixed','Destreza'),
('tiferinos','Tiferinos','Povos marcados por heranças sobrenaturais diversas, cuja presença social pode assumir muitas formas.','/images/linhagens/tiferinos-infernal.png','social',NULL),
('povo-fungico','Povo Fúngico','Seres fúngicos de formas variadas, ligados a ciclos naturais, redes de vida e percepções próprias do mundo.','/images/linhagens/povo-fungico-micelar.png','fixed','Sabedoria'),
('draconatos','Draconatos','Povos de herança dracônica cuja aparência e imponência refletem linhagens metálicas, cromáticas ou gemáticas.','/images/linhagens/draconatos-metalico.png','fixed','Presença'),
('povo-fera','Povo Fera','Povos de características animais variadas, capazes de expressar diferentes adaptações físicas.','/images/linhagens/povo-fera-felino.png','physical',NULL)
ON CONFLICT(id) DO NOTHING;

INSERT INTO lineages(id,race_id,name,description,image_url,skill_group_1,skill_group_2) VALUES
('humanos-terrano','humanos','Terranos','Constituição próxima à humana comum, com grande variedade de aparência. Representam a ancestralidade humana mais difundida.','/images/linhagens/humanos-terrano.png','Campo & Ofício','Conhecimento & Doutrina'),
('humanos-altaneiro','humanos','Altaneiros','Descendentes de povos das grandes altitudes, com facilidade para respirar em ar rarefeito e suportar o frio.','/images/linhagens/humanos-altaneiro.png','Marcial','Campo & Ofício'),
('humanos-maritimo','humanos','Marítimos','Descendentes de povos dos arquipélagos, com adaptações à vida na água.','/images/linhagens/humanos-maritimo.png','Campo & Ofício','Sociedade, Cultura & Expressão'),
('elfos-silvestre','elfos','Silvestres','Herança ligada às florestas; olhos e cabelos podem apresentar tons de folhas, madeira e âmbar.','/images/linhagens/elfos-silvestre.png','Campo & Ofício','Marcial'),
('elfos-astral','elfos','Astrais','Herança ligada ao céu noturno; olhos luminosos e marcas semelhantes a constelações.','/images/linhagens/elfos-astral.png','Conhecimento & Doutrina','Conhecimento & Doutrina'),
('elfos-profundo','elfos','Profundos','Adaptados ao subterrâneo; olhos sensíveis à luz e aparência em tons de pedra, cinza ou violeta.','/images/linhagens/elfos-profundo.png','Sociedade, Cultura & Expressão','Conhecimento & Doutrina'),
('anoes-granitico','anoes','Graníticos','Corpos compactos e ossatura densa, associados às antigas linhagens das montanhas.','/images/linhagens/anoes-granitico.png','Marcial','Campo & Ofício'),
('anoes-igneo','anoes','Ígneos','Herança de regiões vulcânicas; pele quente e cabelos em tons de cobre, carvão ou brasa.','/images/linhagens/anoes-igneo.png','Campo & Ofício','Campo & Ofício'),
('anoes-cristalino','anoes','Cristalinos','Pequenas formações minerais surgem na pele ou nos cabelos, com sensibilidade às vibrações da pedra.','/images/linhagens/anoes-cristalino.png','Sociedade, Cultura & Expressão','Conhecimento & Doutrina'),
('orcs-colossal','orcs','Colossais','Maior estatura e musculatura, com presas e estrutura óssea acentuadas.','/images/linhagens/orcs-colossal.png','Marcial','Marcial'),
('orcs-glacial','orcs','Glaciais','Pelagem fina ou cabelos densos, pele em tons frios e adaptação às baixas temperaturas.','/images/linhagens/orcs-glacial.png','Marcial','Campo & Ofício'),
('orcs-rubro','orcs','Rubros','Pele em tons de ocre, cobre ou vermelho, com adaptação ao calor de regiões áridas.','/images/linhagens/orcs-rubro.png','Marcial','Sociedade, Cultura & Expressão'),
('pequeninos-campestre','pequeninos','Campestres','Pés largos, geralmente cobertos de pelos, e constituição robusta para seu tamanho.','/images/linhagens/pequeninos-campestre.png','Campo & Ofício','Conhecimento & Doutrina'),
('pequeninos-brumoso','pequeninos','Brumosos','Herança feérica sutil, com passos silenciosos e contornos que parecem se confundir com a névoa.','/images/linhagens/pequeninos-brumoso.png','Campo & Ofício','Sociedade, Cultura & Expressão'),
('pequeninos-ribeirinho','pequeninos','Ribeirinhos','Dedos parcialmente palmados e facilidade para nadar e se movimentar em terrenos alagados.','/images/linhagens/pequeninos-ribeirinho.png','Campo & Ofício','Campo & Ofício'),
('goblins-cavernicola','goblins','Cavernícolas','Olhos e orelhas grandes, adaptados à percepção em ambientes subterrâneos.','/images/linhagens/goblins-cavernicola.png','Marcial','Campo & Ofício'),
('goblins-arboricola','goblins','Arborícolas','Membros alongados e dedos fortes, próprios para agarrar galhos e escalar.','/images/linhagens/goblins-arboricola.png','Campo & Ofício','Campo & Ofício'),
('goblins-ferruginoso','goblins','Ferruginosos','Pele de aspecto salpicado, em tons de ferrugem, e capacidade de perceber metais pelo cheiro.','/images/linhagens/goblins-ferruginoso.png','Campo & Ofício','Conhecimento & Doutrina'),
('tiferinos-infernal','tiferinos','Infernais','Chifres marcantes, cauda e sinais de uma herança ligada ao fogo e a antigos pactos.','/images/linhagens/tiferinos-infernal.png','Sociedade, Cultura & Expressão','Conhecimento & Doutrina'),
('tiferinos-abissal','tiferinos','Abissais','Traços assimétricos, chifres irregulares e manifestações de uma herança ligada ao caos e à transformação.','/images/linhagens/tiferinos-abissal.png','Conhecimento & Doutrina','Conhecimento & Doutrina'),
('tiferinos-umbratico','tiferinos','Umbráticos','Cores escuras ou desbotadas, olhos contrastantes e sombras que parecem acompanhar seus movimentos com atraso.','/images/linhagens/tiferinos-umbratico.png','Campo & Ofício','Conhecimento & Doutrina'),
('povo-fungico-micelar','povo-fungico','Micelares','Corpos fibrosos, semelhantes a raízes entrelaçadas, capazes de perceber sinais através de redes de fungos.','/images/linhagens/povo-fungico-micelar.png','Conhecimento & Doutrina','Sociedade, Cultura & Expressão'),
('povo-fungico-chapeleiro','povo-fungico','Chapeleiros','Chapéus de cogumelo de diferentes formatos e cores; produzem pequenos conjuntos de esporos.','/images/linhagens/povo-fungico-chapeleiro.png','Campo & Ofício','Conhecimento & Doutrina'),
('povo-fungico-luminescente','povo-fungico','Luminescentes','Partes do corpo emitem luz, usada para iluminar suavemente e transmitir sinais.','/images/linhagens/povo-fungico-luminescente.png','Conhecimento & Doutrina','Conhecimento & Doutrina'),
('draconatos-metalico','draconatos','Metálicos','Escamas com brilho e aspecto de metal.','/images/linhagens/draconatos-metalico.png','Marcial','Sociedade, Cultura & Expressão'),
('draconatos-cromatico','draconatos','Cromáticos','Escamas de cores intensas e bem definidas.','/images/linhagens/draconatos-cromatico.png','Marcial','Conhecimento & Doutrina'),
('draconatos-gematico','draconatos','Gemáticos','Escamas cristalinas ou facetadas, semelhantes a pedras preciosas.','/images/linhagens/draconatos-gematico.png','Conhecimento & Doutrina','Sociedade, Cultura & Expressão'),
('povo-fera-felino','povo-fera','Felinos','Traços de gatos, linces, onças ou leões, com garras retráteis e equilíbrio apurado.','/images/linhagens/povo-fera-felino.png','Marcial','Campo & Ofício'),
('povo-fera-canideo','povo-fera','Canídeos','Traços de lobos, cães ou raposas, com olfato desenvolvido e orelhas expressivas.','/images/linhagens/povo-fera-canideo.png','Campo & Ofício','Sociedade, Cultura & Expressão'),
('povo-fera-aviano','povo-fera','Avianos','Penas, bicos e características de diferentes aves.','/images/linhagens/povo-fera-aviano.png','Campo & Ofício','Conhecimento & Doutrina')
ON CONFLICT(id) DO NOTHING;

-- --- SEED: SKINS INICIALES ---
INSERT INTO public.skins (name, rarity, cost, image_url) VALUES
('Cristiano Ronaldo', 'rare', 500, '/images/avatares/cristiano.png'),
('Lionel Messi', 'epic', 800, '/images/avatares/messi.png'),
('Neymar Jr.', 'rare', 400, '/images/avatares/neymar.png'),
('Sergio Ramos', 'rare', 300, '/images/avatares/ramos.png'),
('Arturo Vidal', 'epic', 700, '/images/avatares/vidal.png'),
('Alexis Sánchez', 'epic', 700, '/images/avatares/alexis.png'),
('Iván Zamorano', 'legendary', 1200, '/images/avatares/zamorano.png'),
('Marcelo Salas', 'legendary', 1200, '/images/avatares/salas.png')
ON CONFLICT DO NOTHING;

-- --- SEED: TRIVIA QUESTIONS (Fútbol y Club) ---

-- Preguntas para Sub-6 a Sub-10 (Básicas)
INSERT INTO public.trivia_questions (question, options, correct_index, min_age, max_age, reward_points) VALUES
('¿Cuántos jugadores entran a la cancha en un equipo de fútbol profesional?', '["7 jugadores", "11 jugadores", "5 jugadores", "10 jugadores"]', 1, 0, 10, 20),
('¿Qué parte del cuerpo NO puede tocar el balón (excepto el arquero)?', '["La cabeza", "Los pies", "Las manos", "El pecho"]', 2, 0, 10, 20),
('¿Cómo se llama nuestra escuela de fútbol?', '["Escuela Colo-Colo", "Escuela Lo Miranda", "Real Madrid Academy", "Escuela O''Higgins"]', 1, 0, 10, 20),
('¿De qué color es la tarjeta que el árbitro saca para expulsar a un jugador?', '["Tarjeta Amarilla", "Tarjeta Azul", "Tarjeta Roja", "Tarjeta Verde"]', 2, 0, 10, 20),
('¿Quién es el capitán de la Selección Chilena apodado "Bravo"?', '["Arturo Vidal", "Alexis Sánchez", "Claudio Bravo", "Gary Medel"]', 2, 0, 10, 20);

-- Preguntas para Sub-12 a Adultos (Tácticas/Historia)
INSERT INTO public.trivia_questions (question, options, correct_index, min_age, max_age, reward_points) VALUES
('¿En qué año ganó Chile su primera Copa América?', '["2010", "1998", "2015", "2016"]', 2, 11, 99, 30),
('Si un jugador está más cerca de la línea de meta contraria que el balón y el penúltimo adversario, se cobra:', '["Saque de meta", "Fuera de juego (Offside)", "Córner", "Falta indirecta"]', 1, 11, 99, 30),
('¿Qué selección ha ganado más Mundiales de la FIFA en la historia?', '["Alemania", "Argentina", "Brasil", "Italia"]', 2, 11, 99, 30),
('¿Cómo se llama el estadio principal donde juega la Selección Chilena?', '["Estadio Monumental", "Estadio Nacional", "San Carlos de Apoquindo", "Ester Roa"]', 1, 11, 99, 30),
('¿Qué significa la sigla FIFA?', '["Fútbol Internacional de Federaciones Asociadas", "Federación Internacional de Fútbol Asociación", "Fondo Internacional de Fútbol Amateur", "Federación de Idolos del Fútbol"]', 1, 11, 99, 30);

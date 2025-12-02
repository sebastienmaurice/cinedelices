-- Migration : Harmonisation des genres de films
-- Mise à jour des genres existants pour correspondre à la nouvelle liste complète

-- Mettre à jour "animé" vers "animation"
UPDATE movies 
SET genre = 'animation' 
WHERE genre = 'animé';

-- Mettre à jour "romantique" vers "romance"
UPDATE movies 
SET genre = 'romance' 
WHERE genre = 'romantique';

-- Note : Les nouveaux genres disponibles sont maintenant :
-- action, animation, aventure, comédie, crime, documentaire, drame,
-- familial, fantastique, guerre, histoire, horreur, musique, mystère,
-- romance, science-fiction, thriller, téléfilm, western

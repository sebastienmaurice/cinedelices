/**
 * Récupère les données complémentaires d'un film/série TMDB : score,
 * réalisateur, compositeur, casting principal et bande-annonce YouTube.
 *
 * Utilisé à la fois par le endpoint /api/tmdb/details (tmdb.controllers.js)
 * et directement côté serveur à la création d'un film (add-recipes-movies.controllers.js),
 * pour éviter un aller-retour supplémentaire côté client.
 *
 * Conformité CGU TMDB : ces données doivent être issues de l'API officielle
 * (pas de scraping) et rafraîchies au moins tous les 6 mois — voir
 * movie.tmdb_synced_at et l'attribution requise dans partials/footer.ejs.
 */
export async function fetchTmdbMovieDetails(tmdbId, mediaType) {
  const apiKey = process.env.TMDB_API_KEY;
  const apiUrl = process.env.TMDB_API_URL || "https://api.themoviedb.org/3";
  const empty = { director: null, composer: null, main_cast: null, trailer_key: null, tmdb_rating: null };

  if (!apiKey || !tmdbId) return empty;
  const kind = mediaType === "tv" ? "tv" : "movie";

  try {
    const baseParams = `api_key=${apiKey}&language=fr-FR`;
    const [creditsRes, videosRes, detailsRes] = await Promise.all([
      fetch(`${apiUrl}/${kind}/${tmdbId}/credits?${baseParams}`),
      fetch(`${apiUrl}/${kind}/${tmdbId}/videos?${baseParams}`),
      fetch(`${apiUrl}/${kind}/${tmdbId}?${baseParams}`),
    ]);

    const credits = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] };
    const details = detailsRes.ok ? await detailsRes.json() : {};
    let videos = videosRes.ok ? await videosRes.json() : { results: [] };

    let trailer = (videos.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
    if (!trailer) {
      // Repli anglais — les bandes-annonces sont souvent absentes en fr-FR
      const videosEnRes = await fetch(`${apiUrl}/${kind}/${tmdbId}/videos?api_key=${apiKey}&language=en-US`);
      if (videosEnRes.ok) {
        const videosEn = await videosEnRes.json();
        trailer = (videosEn.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
      }
    }

    const crew = credits.crew || [];
    const director = crew.find((c) => c.job === "Director")?.name || null;
    const composer = crew.find((c) => c.job === "Original Music Composer")?.name || null;
    const mainCast = (credits.cast || []).slice(0, 4).map((c) => c.name).join(", ") || null;

    return {
      director,
      composer,
      main_cast: mainCast,
      trailer_key: trailer ? trailer.key : null,
      tmdb_rating: typeof details.vote_average === "number" ? Math.round(details.vote_average * 10) / 10 : null,
    };
  } catch (error) {
    console.error("⚠️  fetchTmdbMovieDetails:", error.message);
    return empty;
  }
}

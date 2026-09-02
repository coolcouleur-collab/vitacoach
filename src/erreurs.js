// ─────────────────────────────────────────────────────────────────────────────
// LIRE CE QUE LE SERVEUR A REPONDU
//
// Le serveur explique ses échecs, en français, sur une trentaine de ses routes :
// « La génération du programme "X" n'a pas abouti. Réessaie dans un instant. »
//
// Le client jetait cette réponse pour lever son propre message, générique, qui
// ne dit ni pourquoi ni quoi faire. L'utilisateur voyait « Erreur lors de la
// création » devant un mur, alors que la réponse tenait la solution.
//
// Constat sur une capture de Jean le 2 septembre, onglet Nutrition.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le message d'erreur d'une réponse HTTP en échec.
 *
 * @param {Response} res     la réponse `fetch`
 * @param {string}   repli   ce qu'on dit si le serveur, lui, n'a rien dit
 * @returns {Promise<Error>} prête à être levée
 */
export async function erreurServeur(res, repli) {
  let message = null
  try {
    const detail = await res.json()
    message = detail?.error || detail?.message || null
  } catch (_) {
    // Une réponse sans JSON, une coupure réseau, une page d'erreur de
    // l'hébergeur : on retombe sur le repli, jamais sur une exception.
  }
  return new Error(message || repli)
}

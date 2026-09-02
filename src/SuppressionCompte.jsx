import { AMBRE, ENCRE, ROUGE } from './palette'
// Page « Supprimer mon compte », exigée par Google Play
// URL : meet-solenn.com/suppression-compte
//
// Google ouvre ce lien pendant l'examen et attend une page PUBLIQUE, sans
// connexion, qui décrit la procédure de suppression, ce qui est effacé et ce
// qui est conservé. Le champ pointait vers /privacy, une route qui n'existe
// pas : le visiteur retombait sur l'écran d'accueil de l'app. Motif de rejet
// certain (relevé le 2026-08-30).
//
// Même habillage que la politique de confidentialité, volontairement : ce sont
// deux pages du même dossier légal.

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, var(--fond-haut) 0%, var(--creme-milieu) 50%, var(--fond-haut) 100%)',
    fontFamily: "'Poppins', system-ui, sans-serif",
    padding: '48px 20px 80px',
  },
  card: {
    maxWidth: 720, margin: '0 auto',
    background: 'rgba(var(--rgb-creme), 0.28)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(var(--rgb-creme-dore), 0.32)',
    borderRadius: 24, padding: '40px 32px',
  },
  h1: {
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
    fontSize: 34, fontWeight: 500, color: ENCRE, marginBottom: 6,
  },
  date: { fontSize: 12, color: AMBRE, marginBottom: 28 },
  h2: { fontSize: 17, fontWeight: 700, color: ENCRE, margin: '26px 0 8px' },
  p: { fontSize: 14, color: ENCRE, lineHeight: 1.75, margin: '0 0 10px' },
  li: { fontSize: 14, color: ENCRE, lineHeight: 1.75, marginBottom: 4 },
  etape: {
    fontSize: 14, color: 'rgba(120,65,25,0.88)', lineHeight: 1.7,
    background: 'rgba(var(--rgb-creme), 0.45)', border: '1px solid rgba(var(--rgb-creme-dore), 0.5)',
    borderRadius: 14, padding: '14px 18px', margin: '0 0 10px',
  },
  lien: { color: AMBRE, fontWeight: 600 },
}

export default function SuppressionCompte() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>Supprimer mon compte</h1>
        <p style={S.date}>Solenn, dernière mise à jour : 30 août 2026</p>

        <p style={S.p}>
          Tu peux supprimer ton compte Solenn et toutes tes données à tout moment,
          directement depuis l'application, sans avoir à nous écrire ni à te justifier.
          La suppression est immédiate et définitive.
        </p>

        <h2 style={S.h2}>Depuis l'application, en trois étapes</h2>
        <p style={S.etape}>1. Ouvre Solenn et connecte-toi à ton compte.</p>
        <p style={S.etape}>2. Va dans <strong>Paramètres</strong>, puis descends jusqu'à la
          section <strong>Mes données</strong>.</p>
        <p style={S.etape}>3. Choisis <strong>Supprimer mon compte</strong> et confirme.</p>

        <h2 style={S.h2}>Ce qui est effacé immédiatement</h2>
        <p style={S.p}>
          Tout ce qui te concerne, sans exception ni délai :
        </p>
        <ul>
          <li style={S.li}>Ton compte et tes identifiants de connexion</li>
          <li style={S.li}>Ton profil, tes objectifs et tes réponses au questionnaire</li>
          <li style={S.li}>Tes mesures de santé : pas, sommeil, poids, fréquence cardiaque, humeur</li>
          <li style={S.li}>Tes conversations avec Solenn et sa mémoire de toi</li>
          <li style={S.li}>Tes programmes, routines, bilans et rapports</li>
          <li style={S.li}>Ton suivi de cycle, si tu l'avais activé</li>
          <li style={S.li}>Tes abonnements aux notifications</li>
        </ul>
        <p style={S.p}>
          Si tu avais un abonnement payant, il est <strong>résilié automatiquement</strong> au
          même moment. Aucun prélèvement ne partira après la suppression de ton compte.
        </p>

        <h2 style={S.h2}>Ce qui est conservé, et pourquoi</h2>
        <p style={S.p}>
          Uniquement ce que la loi nous oblige à garder : les <strong>factures</strong> liées à
          un abonnement payé, conservées dix ans par notre prestataire de paiement Stripe, au
          titre des obligations comptables. Elles ne contiennent que le montant, la date et
          l'adresse de facturation, jamais tes données de santé.
        </p>
        <p style={S.p}>
          Les sauvegardes techniques de notre base de données peuvent contenir une copie de tes
          données pendant au maximum trente jours, le temps de leur rotation normale. Elles ne
          sont jamais consultées et sont écrasées automatiquement.
        </p>

        <h2 style={S.h2}>Si tu n'as plus accès à l'application</h2>
        <p style={S.p}>
          Écris-nous à <a href="mailto:contact@meet-solenn.com" style={S.lien}>contact@meet-solenn.com</a> depuis
          l'adresse email de ton compte, avec pour objet « Suppression de compte ». Nous
          procédons à la suppression sous trente jours au plus, conformément au RGPD, et nous te
          confirmons par email quand c'est fait.
        </p>

        <h2 style={S.h2}>Supprimer une partie de tes données, sans fermer ton compte</h2>
        <p style={S.p}>
          Tu n'es pas obligée de tout supprimer pour effacer quelque chose. Deux moyens :
        </p>
        <p style={S.etape}>
          <strong>Depuis l'application</strong> : Paramètres, puis Mes données, puis
          <strong> Réinitialiser mémoire IA</strong>. Solenn oublie alors tout ce qu'elle avait
          retenu de toi au fil des conversations. Ton compte, tes mesures et tes programmes
          restent intacts.
        </p>
        <p style={S.etape}>
          <strong>Par email</strong> : écris à{' '}
          <a href="mailto:contact@meet-solenn.com" style={S.lien}>contact@meet-solenn.com</a> en
          précisant ce que tu veux voir effacé, par exemple ton historique de conversations, ton
          suivi de cycle ou tes mesures d'une période donnée. Nous le faisons sous trente jours
          au plus et te confirmons par email.
        </p>

        <h2 style={S.h2}>Tes autres droits</h2>
        <p style={S.p}>
          Tu peux aussi demander l'accès à tes données, leur rectification ou leur portabilité,
          sans supprimer ton compte. Le détail figure dans notre{' '}
          <a href="/confidentialite" style={S.lien}>politique de confidentialité</a>.
        </p>
      </div>
    </div>
  )
}

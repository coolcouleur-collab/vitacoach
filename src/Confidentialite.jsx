// Page Politique de confidentialité, requise par App Store & Google Play
// URL : meet-solenn.com/confidentialite
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)',
    fontFamily: "'Poppins', system-ui, sans-serif",
    padding: '48px 20px 80px',
  },
  card: {
    maxWidth: 720, margin: '0 auto',
    background: 'rgba(255,235,210,0.28)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,220,160,0.32)',
    borderRadius: 24, padding: '40px 32px',
  },
  h1: {
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
    fontSize: 34, fontWeight: 500, color: 'rgba(140,75,30,0.95)', marginBottom: 6,
  },
  date: { fontSize: 12, color: 'rgba(200,123,82,0.75)', marginBottom: 28 },
  h2: { fontSize: 17, fontWeight: 700, color: 'rgba(140,75,30,0.92)', margin: '26px 0 8px' },
  p: { fontSize: 14, color: 'rgba(120,65,25,0.85)', lineHeight: 1.75, margin: '0 0 10px' },
  li: { fontSize: 14, color: 'rgba(120,65,25,0.85)', lineHeight: 1.75, marginBottom: 4 },
}

export default function Confidentialite() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>Politique de confidentialité</h1>
        <p style={S.date}>Solenn, dernière mise à jour : 30 août 2026</p>

        <p style={S.p}>
          Solenn est une application de coaching bien-être. Ta vie privée est au cœur de notre
          fonctionnement : cette page explique quelles données nous collectons, pourquoi, et
          quels sont tes droits.
        </p>

        <h2 style={S.h2}>1. Données collectées</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={S.li}><strong>Compte</strong> : adresse e-mail et mot de passe (chiffré).</li>
          <li style={S.li}><strong>Profil</strong> : prénom, âge, objectifs bien-être, niveau d'activité, préférences renseignées lors du questionnaire.</li>
          <li style={S.li}><strong>Données de bien-être</strong> : sommeil, pas, hydratation, humeur, poids, saisies par toi ou synchronisées depuis des services que tu connectes volontairement (Apple Santé, Oura, Garmin, Withings).</li>
          <li style={S.li}><strong>Conversations</strong> : tes échanges avec le coach Solenn, pour assurer la continuité du suivi.</li>
          <li style={S.li}><strong>Paiement</strong> : géré par Stripe ; nous ne stockons jamais tes numéros de carte.</li>
        </ul>

        <h2 style={S.h2}>2. Utilisation des données</h2>
        <p style={S.p}>
          Tes données servent exclusivement à personnaliser ton accompagnement : conseils,
          routines, rapports hebdomadaires et rappels. Pour générer les réponses du coach,
          certaines informations (messages, métriques, profil) sont transmises de manière
          sécurisée à notre fournisseur d'intelligence artificielle (Groq, Inc.), qui ne les
          conserve pas pour entraîner ses modèles. Nous ne vendons jamais tes données et ne
          les partageons avec aucun annonceur.
        </p>

        <h2 style={S.h2}>3. Stockage et sécurité</h2>
        <p style={S.p}>
          Les données sont hébergées chez Supabase (infrastructure chiffrée en transit et au
          repos). L'accès est restreint par des règles de sécurité au niveau de la base de
          données : chaque utilisateur ne peut accéder qu'à ses propres informations. Les
          jetons d'accès aux services santé connectés ne sont jamais exposés côté application.
        </p>

        <h2 style={S.h2}>4. Services tiers</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li style={S.li}>Supabase (base de données et authentification)</li>
          <li style={S.li}>Groq (génération des réponses du coach IA)</li>
          <li style={S.li}>Stripe (paiement de l'abonnement Pro)</li>
          <li style={S.li}>Apple Santé, Oura, Garmin, Withings (uniquement si tu les connectes)</li>
          <li style={S.li}>Vercel et Render (hébergement)</li>
        </ul>

        <h2 style={S.h2}>5. Conservation et suppression</h2>
        <p style={S.p}>
          Tes données sont conservées tant que ton compte est actif. Tu peux le supprimer
          toi-même à tout moment, directement dans l'application : Paramètres, puis Mes
          données, puis Supprimer mon compte. La suppression est immédiate et définitive, et
          un abonnement en cours est résilié au même moment. Le détail de ce qui est effacé
          figure sur la page <a href="/suppression-compte" style={{ color: 'rgba(180,95,40,0.95)', fontWeight: 600 }}>Supprimer mon compte</a>.
        </p>
        <p style={S.p}>
          Si tu n'as plus accès à l'application, écris-nous : la suppression intervient sous 30
          jours au plus, conformément au RGPD. Tu peux aussi demander à tout moment l'accès à
          tes données, leur rectification ou leur portabilité sans supprimer ton compte.
        </p>

        <h2 style={S.h2}>6. Ce que Solenn n'est pas</h2>
        <p style={S.p}>
          Solenn est un outil de bien-être et de motivation. Ce n'est pas un dispositif
          médical et ses conseils ne remplacent jamais l'avis d'un professionnel de santé.
        </p>

        <h2 style={S.h2}>7. Contact</h2>
        <p style={S.p}>
          Pour toute question ou demande concernant tes données :{' '}
          <a href="mailto:coolcouleur@gmail.com" style={{ color: '#C87B52', fontWeight: 600 }}>
            coolcouleur@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}

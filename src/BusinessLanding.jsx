import React, { useState, useEffect } from "react";
import { SparkleIcon, BrainIcon, MoonIcon, FoodIcon } from "./Icons";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  creme: "#FFF8F4",
  orange: "var(--accent)",
  or: "var(--or-plein)",
  nuit: "#0A1633",
};

/* ─────────────────────────────────────────────
   RESPONSIVE HOOK
───────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,400;1,600;1,700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  .bl-root {
    font-family: 'Poppins', sans-serif;
    background: ${T.creme};
    color: ${T.nuit};
    line-height: 1.6;
  }

  .bl-h1 {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 56px;
    font-weight: 700;
    line-height: 1.15;
    color: #fff;
  }

  @media (max-width: 767px) {
    .bl-h1 { font-size: 32px; }
    .bl-hero-btns { flex-direction: column !important; align-items: stretch !important; }
    .bl-hero-metrics { flex-direction: column !important; gap: 24px !important; }
    .bl-problem-cards { flex-direction: column !important; }
    .bl-steps { flex-direction: column !important; }
    .bl-pricing-cards { flex-direction: column !important; align-items: center !important; }
    .bl-pricing-card { width: 100% !important; max-width: 400px !important; }
    .bl-hero-content { padding: 40px 20px 60px !important; }
    .bl-section { padding: 60px 20px !important; }
    .bl-step-connector { display: none !important; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .bl-fade-in {
    animation: fadeInUp 0.7s ease both;
  }
  .bl-fade-in-delay-1 { animation-delay: 0.1s; }
  .bl-fade-in-delay-2 { animation-delay: 0.22s; }
  .bl-fade-in-delay-3 { animation-delay: 0.34s; }
  .bl-fade-in-delay-4 { animation-delay: 0.46s; }

  .bl-btn-primary {
    background: ${T.orange};
    color: #fff;
    border: none;
    border-radius: 16px;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    text-decoration: none;
    display: inline-block;
    white-space: nowrap;
  }
  .bl-btn-primary:hover {
    background: #b86940;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--rgb-terracotta), 0.4);
  }

  .bl-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-radius: 16px;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    text-decoration: none;
    display: inline-block;
    white-space: nowrap;
  }
  .bl-btn-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.65);
  }

  .bl-btn-outlined-orange {
    background: transparent;
    color: ${T.orange};
    border: 1.5px solid ${T.orange};
    border-radius: 16px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    width: 100%;
    text-align: center;
  }
  .bl-btn-outlined-orange:hover {
    background: rgba(var(--rgb-terracotta), 0.08);
  }

  .bl-btn-filled-orange {
    background: linear-gradient(135deg, ${T.orange} 0%, ${T.or} 100%);
    color: #fff;
    border: none;
    border-radius: 16px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 20px rgba(var(--rgb-terracotta), 0.35);
  }
  .bl-btn-filled-orange:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(var(--rgb-terracotta), 0.5);
  }

  .bl-btn-outlined-nuit {
    background: transparent;
    color: ${T.nuit};
    border: 1.5px solid ${T.nuit};
    border-radius: 16px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
    text-align: center;
  }
  .bl-btn-outlined-nuit:hover {
    background: rgba(10,22,51,0.06);
  }

  .bl-input {
    background: rgba(255,255,255,0.08);
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 15px;
    font-family: 'Poppins', sans-serif;
    color: #fff;
    width: 100%;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .bl-input:focus {
    border-color: ${T.orange};
    background: rgba(255,255,255,0.12);
  }
  .bl-input option { color: ${T.nuit}; background: #fff; }

  .bl-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: ${T.creme};
    border-radius: 28px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    margin-bottom: 28px;
  }

  .bl-badge-sm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(var(--rgb-terracotta), 0.12);
    border: 1px solid rgba(var(--rgb-terracotta), 0.25);
    color: ${T.orange};
    border-radius: 28px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .bl-section-title {
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 32px;
    color: ${T.nuit};
    line-height: 1.25;
    margin-bottom: 16px;
  }

  .bl-section-subtitle {
    font-size: 17px;
    color: rgba(10,22,51,0.6);
    max-width: 560px;
    margin: 0 auto 48px;
  }

  .bl-problem-card {
    background: rgba(var(--rgb-terracotta), 0.06);
    border: 1.5px solid rgba(var(--rgb-terracotta), 0.14);
    border-radius: 20px;
    padding: 28px 24px;
    flex: 1;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .bl-problem-card:hover {
    box-shadow: 0 8px 32px rgba(var(--rgb-terracotta), 0.12);
    transform: translateY(-3px);
  }

  .bl-step-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${T.orange} 0%, ${T.or} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    font-family: 'Poppins', sans-serif;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(var(--rgb-terracotta), 0.35);
    margin: 0 auto 16px;
  }

  .bl-pricing-card {
    background: #fff;
    border: 1.5px solid rgba(var(--rgb-terracotta), 0.15);
    border-radius: 20px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s, transform 0.2s;
    position: relative;
  }
  .bl-pricing-card:hover {
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    transform: translateY(-4px);
  }
  .bl-pricing-card.featured {
    background: linear-gradient(160deg, rgba(var(--rgb-terracotta), 0.07) 0%, rgba(var(--rgb-or), 0.07) 100%);
    border: 2px solid ${T.orange};
    box-shadow: 0 8px 32px rgba(var(--rgb-terracotta), 0.2);
    transform: scale(1.03);
  }
  .bl-pricing-card.featured:hover {
    transform: scale(1.03) translateY(-4px);
  }

  .bl-popular-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, ${T.orange} 0%, ${T.or} 100%);
    color: #fff;
    border-radius: 28px;
    padding: 5px 18px;
    font-size: 12px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(var(--rgb-terracotta), 0.4);
  }

  .bl-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: rgba(10,22,51,0.75);
    margin-bottom: 10px;
  }
  .bl-feature-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(var(--rgb-terracotta), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .bl-feature-dot::after {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${T.orange};
  }

  .bl-metric-divider {
    width: 1px;
    height: 48px;
    background: rgba(255,255,255,0.18);
  }

  @media (max-width: 767px) {
    .bl-metric-divider { display: none; }
    .bl-section-title { font-size: 26px; }
  }
`;

function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

/* ─────────────────────────────────────────────
   SECTION 1, HERO
───────────────────────────────────────────── */
function HeroSection({ onDemanderDemo }) {
  const scrollToPricing = (e) => {
    e.preventDefault();
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        background: "linear-gradient(160deg, #0A1633 0%, #1a2a50 60%, #2d1810 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--rgb-terracotta), 0.18) 0%, transparent 70%)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--rgb-or), 0.12) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="bl-hero-content"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 40px 80px",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Badge */}
        <div className="bl-fade-in">
          <span className="bl-badge">
            <SparkleIcon color={T.creme} size={15} />
            Nouveau, Solenn pour les entreprises
          </span>
        </div>

        {/* H1 */}
        <h1
          className="bl-h1 bl-fade-in bl-fade-in-delay-1"
          style={{ maxWidth: "720px", marginBottom: "24px" }}
        >
          Le bien-être de vos équipes,{"\n"}automatisé et personnalisé
        </h1>

        {/* Sous-titre */}
        <p
          className="bl-fade-in bl-fade-in-delay-2"
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.7)",
            maxWidth: "600px",
            marginBottom: "40px",
            fontFamily: "'Poppins', sans-serif",
            lineHeight: 1.7,
          }}
        >
          Solenn accompagne chaque collaborateur individuellement, nutrition, sommeil, stress,
          énergie. Votre RH voit les tendances. Sans effort.
        </p>

        {/* Boutons */}
        <div
          className="bl-hero-btns bl-fade-in bl-fade-in-delay-3"
          style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "64px" }}
        >
          <button className="bl-btn-primary" onClick={onDemanderDemo}>
            Demander une démo →
          </button>
          <a href="#pricing" className="bl-btn-secondary" onClick={scrollToPricing}>
            Voir les tarifs
          </a>
        </div>

        {/* Métriques */}
        <div
          className="bl-hero-metrics bl-fade-in bl-fade-in-delay-4"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "-32%", label: "d'absentéisme" },
            { value: "87%", label: "d'adoption" },
            { value: "ROI", label: "en 3 mois" },
          ].map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="bl-metric-divider" />}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: T.or,
                    fontFamily: "'Poppins', sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Poppins', sans-serif",
                    marginTop: "2px",
                  }}
                >
                  {m.label}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 2, LE PROBLÈME
───────────────────────────────────────────── */
const problemCards = [
  {
    Icon: BrainIcon,
    title: "Burnout en hausse",
    desc: "1 salarié sur 3 est en détresse psychologique. Les RH n'ont aucun outil d'alerte précoce.",
  },
  {
    Icon: MoonIcon,
    title: "Sommeil et productivité",
    desc: "Un collaborateur qui dort mal coûte 3x plus cher en absences et erreurs.",
  },
  {
    Icon: FoodIcon,
    title: "Habitudes non suivies",
    desc: "Les programmes bien-être corporate ont 12% d'adoption en moyenne.",
  },
];

function ProblemSection() {
  return (
    <section
      className="bl-section"
      style={{ background: "#fff", padding: "96px 40px", textAlign: "center" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2 className="bl-section-title">
          Vos collaborateurs sont épuisés.{" "}
          <span style={{ color: T.orange }}>Vous le savez.</span>
        </h2>
        <p
          className="bl-section-subtitle"
          style={{ marginBottom: "56px", marginTop: "12px" }}
        >
          Les outils RH classiques ne détectent pas les signaux faibles. Jusqu'à maintenant.
        </p>

        <div
          className="bl-problem-cards"
          style={{ display: "flex", gap: "24px", alignItems: "stretch" }}
        >
          {problemCards.map((c, i) => (
            <div className="bl-problem-card" key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <c.Icon color={T.orange} size={36} />
              </div>
              <h3
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: T.nuit,
                  marginBottom: "10px",
                }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(10,22,51,0.65)",
                  lineHeight: 1.65,
                }}
              >
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 3, LA SOLUTION
───────────────────────────────────────────── */
const steps = [
  {
    num: "1",
    title: "Chaque employé s'inscrit",
    desc: "Solenn crée un profil santé personnalisé en 3 min, habitudes, objectifs, contraintes.",
  },
  {
    num: "2",
    title: "Solenn les accompagne",
    desc: "Routines matinales, conseils nutrition, suivi sommeil, gestion du stress quotidien.",
  },
  {
    num: "3",
    title: "Les données remontent",
    desc: "Score bien-être anonymisé agrégé par équipe et département, en temps réel.",
  },
  {
    num: "4",
    title: "Vous agissez",
    desc: "Le RH voit les alertes, pilote les actions préventives avant que le problème s'installe.",
  },
];

function SolutionSection() {
  return (
    <section
      className="bl-section"
      style={{ background: T.creme, padding: "96px 40px", textAlign: "center" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div>
          <span className="bl-badge-sm">Comment ça marche</span>
        </div>
        <h2 className="bl-section-title" style={{ marginBottom: "12px" }}>
          Un coach IA pour chacun.{" "}
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: T.orange,
            }}
          >
            Un dashboard pour vous.
          </span>
        </h2>
        <p className="bl-section-subtitle" style={{ marginBottom: "64px" }}>
          Une expérience fluide pour l'employé, une visibilité totale pour le RH.
        </p>

        <div
          className="bl-steps"
          style={{ display: "flex", gap: "0", alignItems: "flex-start" }}
        >
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0 16px",
                }}
              >
                <div className="bl-step-circle">{s.num}</div>
                <h3
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: T.nuit,
                    marginBottom: "8px",
                    textAlign: "center",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(10,22,51,0.6)",
                    lineHeight: 1.6,
                    textAlign: "center",
                  }}
                >
                  {s.desc}
                </p>
              </div>

              {i < steps.length - 1 && (
                <div
                  className="bl-step-connector"
                  style={{
                    flexShrink: 0,
                    width: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      height: "2px",
                      width: "100%",
                      background: `linear-gradient(90deg, ${T.orange} 0%, ${T.or} 100%)`,
                      opacity: 0.4,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 4, PRICING
───────────────────────────────────────────── */
const pricingPlans = [
  {
    name: "Starter",
    tag: "Jusqu'à 25 employés",
    price: "8€",
    unit: "/ employé / mois",
    features: [
      "Coach IA illimité",
      "Routines personnalisées",
      "Rapport mensuel RH",
      "Support email",
    ],
    cta: "Commencer",
    ctaType: "outlined-orange",
    featured: false,
  },
  {
    name: "Business",
    tag: "25 à 200 employés",
    price: "6€",
    unit: "/ employé / mois",
    features: [
      "Tout Starter",
      "Dashboard RH temps réel",
      "Alertes bien-être",
      "Intégrations Withings / Oura",
      "Support prioritaire",
      "Onboarding dédié",
    ],
    cta: "Démarrer Business",
    ctaType: "filled-orange",
    featured: true,
  },
  {
    name: "Enterprise",
    tag: "200+ employés",
    price: "Sur devis",
    unit: "",
    features: [
      "Tout Business",
      "SSO",
      "API dédiée",
      "Tableaux de bord personnalisés",
      "Account manager dédié",
      "SLA garanti",
    ],
    cta: "Nous contacter",
    ctaType: "outlined-nuit",
    featured: false,
  },
];

function PricingSection({ onDemanderDemo }) {
  return (
    <section
      id="pricing"
      className="bl-section"
      style={{ background: "#fff", padding: "96px 40px", textAlign: "center" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div>
          <span className="bl-badge-sm">Tarifs</span>
        </div>
        <h2 className="bl-section-title" style={{ marginBottom: "12px" }}>
          Des tarifs simples, sans surprise
        </h2>
        <p className="bl-section-subtitle" style={{ marginBottom: "64px" }}>
          Facturation mensuelle. Sans engagement minimum. Résiliable à tout moment.
        </p>

        <div
          className="bl-pricing-cards"
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          {pricingPlans.map((plan, i) => (
            <div
              key={i}
              className={`bl-pricing-card${plan.featured ? " featured" : ""}`}
              style={{ width: "320px", minWidth: "260px" }}
            >
              {plan.featured && (
                <div className="bl-popular-badge">
                  <SparkleIcon color="#fff" size={13} />
                  Populaire
                </div>
              )}

              <div style={{ marginBottom: "8px" }}>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: T.nuit,
                  }}
                >
                  {plan.name}
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(10,22,51,0.55)",
                  marginBottom: "24px",
                }}
              >
                {plan.tag}
              </div>

              <div style={{ marginBottom: "28px" }}>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: plan.price === "Sur devis" ? "26px" : "40px",
                    color: T.nuit,
                    lineHeight: 1.1,
                  }}
                >
                  {plan.price}
                </span>
                {plan.unit && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(10,22,51,0.5)",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    {plan.unit}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, marginBottom: "28px", textAlign: "left" }}>
                {plan.features.map((f, j) => (
                  <div className="bl-feature-item" key={j}>
                    <div className="bl-feature-dot" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {plan.ctaType === "outlined-orange" && (
                <button className="bl-btn-outlined-orange" onClick={onDemanderDemo}>
                  {plan.cta}
                </button>
              )}
              {plan.ctaType === "filled-orange" && (
                <button className="bl-btn-filled-orange" onClick={onDemanderDemo}>
                  {plan.cta}
                </button>
              )}
              {plan.ctaType === "outlined-nuit" && (
                <button className="bl-btn-outlined-nuit" onClick={onDemanderDemo}>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 5, DEMO FORM
───────────────────────────────────────────── */
function DemoFormSection() {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    entreprise: "",
    taille: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.entreprise || !form.taille) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setSuccess(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou écrivez-nous directement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="demo"
      style={{
        background: T.nuit,
        padding: "96px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(var(--rgb-terracotta), 0.15) 0%, transparent 70%)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            color: "#fff",
            marginBottom: "16px",
            lineHeight: 1.25,
          }}
        >
          Prêt à transformer le bien-être{" "}
          <br />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: T.or,
            }}
          >
            de vos équipes ?
          </span>
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,248,244,0.65)",
            marginBottom: "48px",
          }}
        >
          Démo gratuite de 30 min · Mise en place en 48h · Sans engagement
        </p>

        {success ? (
          <div
            style={{
              maxWidth: "480px",
              margin: "0 auto",
              background: "rgba(var(--rgb-terracotta), 0.12)",
              border: "1.5px solid rgba(var(--rgb-terracotta), 0.35)",
              borderRadius: "20px",
              padding: "40px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke={T.or}
                  strokeWidth="2"
                  fill={T.or}
                  fillOpacity="0.15"
                />
                <path
                  d="M8 12.5l2.6 2.5L16 9.5"
                  stroke={T.or}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                color: "#fff",
                marginBottom: "10px",
              }}
            >
              Demande envoyée !
            </h3>
            <p style={{ color: "rgba(255,248,244,0.7)", fontSize: "15px" }}>
              Notre équipe vous contacte sous 24h pour planifier votre démo gratuite.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              maxWidth: "480px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <input
              className="bl-input"
              type="text"
              name="nom"
              placeholder="Prénom & Nom"
              value={form.nom}
              onChange={handleChange}
              autoComplete="name"
            />
            <input
              className="bl-input"
              type="email"
              name="email"
              placeholder="Email professionnel"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            <input
              className="bl-input"
              type="text"
              name="entreprise"
              placeholder="Nom de l'entreprise"
              value={form.entreprise}
              onChange={handleChange}
              autoComplete="organization"
            />
            <select
              className="bl-input"
              name="taille"
              value={form.taille}
              onChange={handleChange}
              style={{ appearance: "none", cursor: "pointer" }}
            >
              <option value="" disabled>
                Taille de l'équipe
              </option>
              <option value="1-25">1 – 25 employés</option>
              <option value="25-100">25 – 100 employés</option>
              <option value="100-500">100 – 500 employés</option>
              <option value="500+">500+ employés</option>
            </select>

            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "rgba(var(--rgb-terracotta), 0.5)"
                  : `linear-gradient(135deg, ${T.orange} 0%, ${T.or} 100%)`,
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                width: "100%",
                marginTop: "6px",
                transition: "opacity 0.2s, box-shadow 0.2s",
                boxShadow: loading ? "none" : "0 6px 24px rgba(var(--rgb-terracotta), 0.45)",
              }}
            >
              {loading ? "Envoi en cours…" : "Demander ma démo gratuite →"}
            </button>

            <p
              style={{
                fontSize: "12px",
                color: "rgba(255,248,244,0.45)",
                textAlign: "center",
                marginTop: "4px",
              }}
            >
              Réponse sous 24h · Données sécurisées · Sans engagement
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      style={{
        background: T.nuit,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 40px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "13px",
          color: "rgba(255,248,244,0.45)",
        }}
      >
        Solenn Business · contact@meet-solenn.com · © 2026
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function BusinessLanding({ onDemanderDemo }) {
  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDemanderDemo = () => {
    if (typeof onDemanderDemo === "function") {
      onDemanderDemo();
    } else {
      scrollToDemo();
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="bl-root" style={{ minHeight: "100vh", background: T.creme }}>
        <HeroSection onDemanderDemo={handleDemanderDemo} />
        <ProblemSection />
        <SolutionSection />
        <PricingSection onDemanderDemo={handleDemanderDemo} />
        <DemoFormSection />
        <Footer />
      </div>
    </>
  );
}

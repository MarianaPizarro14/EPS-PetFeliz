import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaw,
  faStar,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./Planes.css";
import CtaBanner from "../CtaBanner";

// ── DATOS FIJOS ──
const planAfiliado = {
  precio: "Desde $80.000",
  consultas: "Gratis",
  medicamentos: "Precio con descuento",
  hospitalizacion: "Gratis",
  nota: "  3 consultas/mes incluidas sin costo",
};

const planSinAfiliacion = {
  precio: "$70.000",
  consulta: "$70.000",
  medicamentos: "Por definir",
  hospitalizacion: "Por definir",
};

const features = [
  { label: "Consultas veterinarias",     afiliado: true,       noAfiliado: false      },
  { label: "Vacunación preventiva",      afiliado: true,       noAfiliado: false      },
  { label: "Consultas al mes",           afiliado: "3/mes",    noAfiliado: "$70.000"  },
  { label: "Descuentos en medicamentos", afiliado: true,       noAfiliado: false      },
  { label: "Hospitalización cubierta",   afiliado: true,       noAfiliado: false      },
];

// ── VARIANTES ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardAnim = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── ÍCONOS ──
const CheckIcon = () => (
  <span className="planes-icon-check">
    <FontAwesomeIcon icon={faCircleCheck} />
  </span>
);

const XIcon = () => (
  <span className="planes-icon-x">
    <FontAwesomeIcon icon={faCircleXmark} />
  </span>
);

// ── SPRING CONFIG ──
const spring = { type: "spring", stiffness: 280, damping: 24 };

// ── COMPONENTE ──
export default function Planes() {
  const [hovered, setHovered] = useState("none");

  const cardProps = (id) => {
    const isHovered  = hovered === id;
    const otherHover = hovered !== "none" && !isHovered;
    return {
      animate: {
        scale:   isHovered ? 1.035 : otherHover ? 0.97 : 1,
        opacity: isHovered ? 1      : otherHover ? 0.72 : 1,
        y:       isHovered ? -6     : 0,
      },
      transition: spring,
      onHoverStart: () => setHovered(id),
      onHoverEnd:   () => setHovered("none"),
    };
  };

  return (
    <div>

      {/* ── HERO ── */}
      <section className="planes-hero">
        <div className="container">

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="planes-hero__eyebrow">
              <FontAwesomeIcon icon={faPaw} />
              Planes EPS PetFeliz
            </span>
          </motion.div>

          <motion.h1
            className="planes-hero__title"
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
          >
            El cuidado que tu mascota<br />
            <span className="highlight">merece y tú puedes pagar</span>
          </motion.h1>

          <motion.p
            className="planes-hero__sub"
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
          >
            Afíliate y accede a consultas gratuitas, descuentos en medicamentos
            y cobertura de hospitalización desde el primer día.
          </motion.p>

        </div>
      </section>

      {/* ── TARJETAS ── */}
      <section className="planes-cards-section">
        <div className="container">
          <div className="planes-cards-grid">

            {/* ── Plan Afiliado (principal) ── */}
            <motion.div
              className="planes-card planes-card--featured"
              variants={cardAnim} initial="hidden" animate="visible" custom={0}
              {...cardProps("afiliado")}
            >
              <span className="planes-card__badge">
                <FontAwesomeIcon icon={faStar} />
                Recomendado
              </span>

              <p className="planes-card__title">Plan Afiliado</p>
              <p className="planes-card__desc">
                Protección completa: consultas, medicamentos y hospitalización cubiertos.
              </p>

              <div className="planes-card__price">
                <span className="planes-price-amount">{planAfiliado.precio}</span>
                <span className="planes-price-period">/ mes</span>
              </div>

              <div className="planes-divider" />

              <div className="planes-card-rows">
                {[
                  { label: "Consultas veterinarias", value: planAfiliado.consultas,       free: true  },
                  { label: "Medicamentos",            value: planAfiliado.medicamentos,    free: false },
                  { label: "Hospitalización",         value: planAfiliado.hospitalizacion, free: true  },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    className="planes-card-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.3 }}
                  >
                    <span className="planes-row-label">{row.label}</span>
                    <span className={`planes-row-value ${row.free ? "planes-row-value--free" : ""}`}>
                      {row.value}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="planes-card-note">
                <FontAwesomeIcon icon={faPaw} />
                {planAfiliado.nota}
              </div>

              <motion.button
                className="planes-btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Afiliarme ahora
              </motion.button>
            </motion.div>

            {/* ── Sin afiliación (secundario) ── */}
            <motion.div
              className="planes-card planes-card--secondary"
              variants={cardAnim} initial="hidden" animate="visible" custom={1}
              {...cardProps("secundario")}
            >
              <p className="planes-card__title">Sin afiliación</p>
              <p className="planes-card__desc">
                Paga solo cuando lo necesites, sin compromiso.
              </p>

              <div className="planes-card__price">
                <span className="planes-price-amount">{planSinAfiliacion.precio}</span>
                <span className="planes-price-period">/ consulta</span>
              </div>

              <div className="planes-divider" />

              <div className="planes-card-rows">
                {[
                  { label: "Consulta veterinaria", value: planSinAfiliacion.consulta        },
                  { label: "Medicamentos",          value: planSinAfiliacion.medicamentos    },
                  { label: "Hospitalización",       value: planSinAfiliacion.hospitalizacion },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    className="planes-card-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.07, duration: 0.3 }}
                  >
                    <span className="planes-row-label">{row.label}</span>
                    <span className="planes-row-value planes-row-value--muted">{row.value}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="planes-btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Usar sin afiliación
              </motion.button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── TABLA COMPARATIVA ── */}
      <motion.section
        className="planes-table-section"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container">
          <p className="planes-section-label">Comparativa rápida</p>
          <div className="planes-compare-wrap">
            <table className="planes-compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="planes-th-afiliado">Afiliado</th>
                  <th className="planes-th-no">No afiliado</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                  >
                    <td>{f.label}</td>
                    <td>
                      {f.afiliado === true  ? <CheckIcon /> :
                       f.afiliado === false ? <XIcon />     :
                       <span className="planes-td-val">{f.afiliado}</span>}
                    </td>
                    <td>
                      {f.noAfiliado === true  ? <CheckIcon /> :
                       f.noAfiliado === false ? <XIcon />     :
                       <span className="planes-td-val">{f.noAfiliado}</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* ── CTA FINAL ── */}
      <CtaBanner
        title="¿Tienes dudas sobre qué plan elegir?"
        subtitle="Nuestros asesores te ayudan a encontrar la mejor opción para tu mascota, sin ningún costo."
        buttons={[
          { label: 'Hablar con un asesor', href: '#', variant: 'btn-primary' },
        ]}
      />

    </div>
  );
}
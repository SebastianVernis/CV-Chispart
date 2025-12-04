-- Seed script: Insert Rafael's default CV
-- Run this after migration to populate Rafael's account with initial CV data

-- Insert Rafael's default CV
INSERT OR IGNORE INTO cvs (id, user_id, name, data, slug, is_public, created_at, updated_at)
VALUES (
  'cv_rafael_principal',
  'user_rafael',
  'CV Principal',
  '{
    "name": "Rafael Mora Melo",
    "role": "Coordinador de Comunicación & Relaciones Públicas",
    "location": "Ciudad de México, México",
    "phone": "+52 55 4290 4869",
    "email": "rafaelmoramelo@gmail.com",
    "linkedin": "/in/rafaelmoramelo",
    "summary": "Profesional en Ciencias de la Comunicación con experiencia en planificación, coordinación y ejecución de estrategias de comunicación institucional, relaciones públicas y posicionamiento de marca. Enfoque en construcción de mensajes coherentes, coordinación de eventos y gestión de stakeholders clave, con sólida capacidad de análisis de resultados mediante KPI y KRI.",
    "cvFocus": "general",
    "experiences": [
      {
        "role": "Coordinador de Comunicación y Marketing",
        "company": "GSP | Ciudad de México",
        "dates": "2022 - Actual",
        "responsibilities": "Planificación y ejecución de estrategias de comunicación institucional para fortalecimiento de la marca y posicionamiento ante stakeholders clave.\nCoordinación de campañas integrales (digitales y presenciales) asegurando coherencia de mensajes, identidad visual y alineación con objetivos organizacionales.\nGestión de relaciones con socios estratégicos y actores clave para activaciones de marca, eventos y proyectos especiales.\nAnálisis de resultados mediante indicadores clave (KPI/KRI) para la toma de decisiones y optimización de estrategias de comunicación."
      },
      {
        "role": "Especialista en Comunicación y Marketing Digital",
        "company": "GADUSA | Ciudad de México",
        "dates": "2019 - 2022",
        "responsibilities": "Diseño y ejecución de campañas de comunicación orientadas a posicionar la organización frente a clientes, aliados y público objetivo.\nMonitoreo de presencia de la marca en medios y canales digitales, identificando oportunidades y riesgos reputacionales.\nRedacción de mensajes, piezas institucionales y materiales de apoyo para presentaciones, informes y comunicados.\nCoordinación de eventos corporativos y actividades de relacionamiento con clientes y aliados, asegurando una experiencia alineada con la imagen institucional."
      }
    ],
    "education": [
      {
        "degree": "Licenciatura en Ciencias de la Comunicación",
        "institution": "Universidad Nacional Autónoma de México",
        "dates": "2015 - 2019"
      }
    ],
    "skills": "Comunicación institucional, Relaciones públicas, Gestión de medios, Eventos corporativos, Análisis de KPIs y KRIs, Redacción institucional, Gestión de crisis, Trabajo en equipo, Organización y planificación, Diplomacia y saber estar",
    "tools": "Microsoft Office, Canva, Adobe Illustrator, Google Analytics, Data Studio, Plataformas de medios"
  }',
  'rafael-cv-principal',
  0,
  datetime('now'),
  datetime('now')
);

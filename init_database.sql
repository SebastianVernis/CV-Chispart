-- Complete Database Initialization Script
-- Run this to set up a fresh database with Rafael's account and CV

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cvs;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  created_at TEXT NOT NULL
);

-- Create cvs table
CREATE TABLE cvs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  profile_image TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_updated_at ON cvs(updated_at DESC);
CREATE INDEX idx_cvs_slug ON cvs(slug);
CREATE INDEX idx_cvs_public ON cvs(is_public);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email_verification ON users(email_verification_token);

-- Insert Rafael's user account
-- Password: RMora1* (stored as plain text for demo, use bcrypt in production)
INSERT INTO users (id, username, password_hash, email, email_verified, email_verification_token, created_at) 
VALUES (
  'user_rafael',
  'rafael',
  'RMora1*',
  'rafaelmoramelo@gmail.com',
  1,
  NULL,
  datetime('now')
);

-- Insert Rafael's default CV
INSERT INTO cvs (id, user_id, name, data, slug, is_public, created_at, updated_at)
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

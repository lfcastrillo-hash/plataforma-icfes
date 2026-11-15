-- Base NUEVA local/de pruebas. No ejecutar sobre un esquema existente.
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 120),
  email VARCHAR(254) NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('estudiante','profesor')),
  biografia TEXT NOT NULL DEFAULT '',
  foto_perfil TEXT,
  foto_datos BYTEA,
  foto_tipo TEXT,
  foto_nombre TEXT UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_normalizado ON usuarios(lower(email));
CREATE TABLE IF NOT EXISTS clases (
  id_clase SERIAL PRIMARY KEY,
  nombre_clase VARCHAR(120) NOT NULL CHECK (length(trim(nombre_clase)) BETWEEN 1 AND 120),
  id_profesor INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  codigo_acceso VARCHAR(12) NOT NULL UNIQUE,
  anuncio TEXT NOT NULL DEFAULT '' CHECK (length(anuncio) <= 5000)
);
CREATE TABLE IF NOT EXISTS inscripciones (
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_clase INTEGER NOT NULL REFERENCES clases(id_clase) ON DELETE CASCADE,
  PRIMARY KEY (id_usuario, id_clase)
);
CREATE TABLE IF NOT EXISTS progreso_areas (
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  correo TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('matematicas','lectura','ciencias','sociales','ingles')),
  progreso NUMERIC NOT NULL DEFAULT 0 CHECK (progreso BETWEEN 0 AND 100),
  estado JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (id_usuario, area)
);
CREATE TABLE IF NOT EXISTS progreso_estudiante (
  id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  correo TEXT NOT NULL,
  progreso_matematicas NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_matematicas BETWEEN 0 AND 100),
  progreso_lectura NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_lectura BETWEEN 0 AND 100),
  progreso_ciencias NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_ciencias BETWEEN 0 AND 100),
  progreso_sociales NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_sociales BETWEEN 0 AND 100),
  progreso_ingles NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_ingles BETWEEN 0 AND 100),
  progreso_global NUMERIC NOT NULL DEFAULT 0 CHECK (progreso_global BETWEEN 0 AND 100)
);
CREATE TABLE IF NOT EXISTS sesiones (
  id_sesion UUID PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  expira TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sesiones_expira ON sesiones(expira);
CREATE TABLE IF NOT EXISTS resultados_simulacro (
  id_resultado UUID PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modalidad TEXT NOT NULL CHECK (modalidad IN ('general','area','temas')),
  resultado JSONB NOT NULL
);

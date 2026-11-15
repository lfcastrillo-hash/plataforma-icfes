-- SOLO para una copia restaurada del esquema antiguo. Revisar antes de producción.
-- No borra filas ni modifica contraseñas. Ejecutar dentro de una transacción.
ALTER TABLE usuarios ALTER COLUMN password TYPE TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS biografia TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_datos BYTEA;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_tipo TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_nombre TEXT;
-- Los duplicados de correo provocan un fallo y ROLLBACK; resolverlos manualmente.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_normalizado ON usuarios(lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_foto_nombre ON usuarios(foto_nombre);
ALTER TABLE clases ADD COLUMN IF NOT EXISTS anuncio TEXT DEFAULT '';
ALTER TABLE progreso_areas ADD COLUMN IF NOT EXISTS id_usuario INTEGER REFERENCES usuarios(id_usuario);
ALTER TABLE progreso_areas ADD COLUMN IF NOT EXISTS estado JSONB NOT NULL DEFAULT '{}';
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS id_usuario INTEGER REFERENCES usuarios(id_usuario);
UPDATE progreso_areas p SET id_usuario = u.id_usuario FROM usuarios u WHERE lower(trim(p.correo)) = lower(trim(u.email)) AND p.id_usuario IS NULL;
UPDATE progreso_estudiante p SET id_usuario = u.id_usuario FROM usuarios u WHERE lower(trim(p.correo)) = lower(trim(u.email)) AND p.id_usuario IS NULL;
-- Los huérfanos se conservan. NOT NULL impide aprobar una migración incompleta.
ALTER TABLE progreso_areas ALTER COLUMN id_usuario SET NOT NULL;
ALTER TABLE progreso_estudiante ALTER COLUMN id_usuario SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS progreso_areas_usuario_area ON progreso_areas(id_usuario, area);
CREATE UNIQUE INDEX IF NOT EXISTS progreso_estudiante_usuario ON progreso_estudiante(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS inscripciones_usuario_clase ON inscripciones(id_usuario,id_clase);
CREATE UNIQUE INDEX IF NOT EXISTS clases_codigo_acceso ON clases(codigo_acceso);
-- El vínculo estable por ID sustituye únicamente las FK antiguas basadas en correo.
DO $$
DECLARE fk RECORD;
BEGIN
  FOR fk IN SELECT c.conname, c.conrelid::regclass AS tabla
    FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
    WHERE c.contype='f' AND c.confrelid='usuarios'::regclass
      AND c.conrelid IN ('progreso_areas'::regclass,'progreso_estudiante'::regclass) AND a.attname='correo'
  LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',fk.tabla,fk.conname); END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='usuarios_rol_valido') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_valido CHECK(rol IN ('estudiante','profesor'));
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='progreso_area_rango') THEN
    ALTER TABLE progreso_areas ADD CONSTRAINT progreso_area_rango CHECK(progreso BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='progreso_area_valida') THEN
    ALTER TABLE progreso_areas ADD CONSTRAINT progreso_area_valida CHECK(area IN ('matematicas','lectura','ciencias','sociales','ingles'));
  END IF;
END $$;
UPDATE usuarios SET email=lower(trim(email));
UPDATE progreso_areas p SET correo=u.email FROM usuarios u WHERE p.id_usuario=u.id_usuario;
UPDATE progreso_estudiante p SET correo=u.email FROM usuarios u WHERE p.id_usuario=u.id_usuario;
-- Consolidar también los porcentajes del mecanismo anterior, sin disminuir avances.
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS progreso_matematicas NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS progreso_lectura NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS progreso_ciencias NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS progreso_sociales NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE progreso_estudiante ADD COLUMN IF NOT EXISTS progreso_ingles NUMERIC NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE
    progreso_matematicas NOT BETWEEN 0 AND 100 OR progreso_lectura NOT BETWEEN 0 AND 100 OR
    progreso_ciencias NOT BETWEEN 0 AND 100 OR progreso_sociales NOT BETWEEN 0 AND 100 OR progreso_ingles NOT BETWEEN 0 AND 100)
  THEN RAISE EXCEPTION 'Existen porcentajes históricos fuera de rango. Revisar la copia sin borrar datos.'; END IF;
END $$;
INSERT INTO progreso_areas(id_usuario,correo,area,progreso)
SELECT p.id_usuario,p.correo,v.area,v.progreso
FROM progreso_estudiante p CROSS JOIN LATERAL (VALUES
  ('matematicas',COALESCE(p.progreso_matematicas,0)), ('lectura',COALESCE(p.progreso_lectura,0)),
  ('ciencias',COALESCE(p.progreso_ciencias,0)), ('sociales',COALESCE(p.progreso_sociales,0)), ('ingles',COALESCE(p.progreso_ingles,0))
) v(area,progreso)
ON CONFLICT(id_usuario,area) DO UPDATE SET progreso=GREATEST(progreso_areas.progreso,EXCLUDED.progreso);
CREATE TABLE IF NOT EXISTS sesiones (id_sesion UUID PRIMARY KEY, id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE, expira TIMESTAMPTZ NOT NULL);
CREATE INDEX IF NOT EXISTS sesiones_expira ON sesiones(expira);
CREATE TABLE IF NOT EXISTS resultados_simulacro (id_resultado UUID PRIMARY KEY, id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario), fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(), modalidad TEXT NOT NULL CHECK (modalidad IN ('general','area','temas')), resultado JSONB NOT NULL);

-- 003: contrato final posterior a 001 o 002. Ejecutar dentro de BEGIN/COMMIT.

-- Aborta ante nulos, duplicados, longitudes o referencias inválidas. No borra ni corrige filas.

-- Bloquea las siete tablas durante la comprobación y cambio para evitar carreras.

LOCK TABLE usuarios, clases, inscripciones, progreso_areas, progreso_estudiante, sesiones, resultados_simulacro IN ACCESS EXCLUSIVE MODE;

DO $$ BEGIN
IF EXISTS(SELECT 1 FROM usuarios WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'usuarios.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE nombre IS NULL) THEN RAISE EXCEPTION 'usuarios.nombre: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE email IS NULL) THEN RAISE EXCEPTION 'usuarios.email: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE password IS NULL) THEN RAISE EXCEPTION 'usuarios.password: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE rol IS NULL) THEN RAISE EXCEPTION 'usuarios.rol: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE biografia IS NULL) THEN RAISE EXCEPTION 'usuarios.biografia: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM usuarios GROUP BY id_usuario HAVING count(*)>1) THEN RAISE EXCEPTION 'usuarios: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE NOT (length(trim(nombre)) BETWEEN 1 AND 120)) THEN RAISE EXCEPTION 'usuarios.nombre: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE NOT (length(trim(email)) BETWEEN 1 AND 254)) THEN RAISE EXCEPTION 'usuarios.email: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE NOT (rol IN ('estudiante','profesor'))) THEN RAISE EXCEPTION 'usuarios.rol: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE length(nombre)>120) THEN RAISE EXCEPTION 'usuarios.nombre: longitud excesiva'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE length(email)>254) THEN RAISE EXCEPTION 'usuarios.email: longitud excesiva'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE id_clase IS NULL) THEN RAISE EXCEPTION 'clases.id_clase: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE nombre_clase IS NULL) THEN RAISE EXCEPTION 'clases.nombre_clase: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE id_profesor IS NULL) THEN RAISE EXCEPTION 'clases.id_profesor: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE codigo_acceso IS NULL) THEN RAISE EXCEPTION 'clases.codigo_acceso: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE anuncio IS NULL) THEN RAISE EXCEPTION 'clases.anuncio: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM clases GROUP BY id_clase HAVING count(*)>1) THEN RAISE EXCEPTION 'clases: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE NOT (length(trim(nombre_clase)) BETWEEN 1 AND 120)) THEN RAISE EXCEPTION 'clases.nombre: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE NOT (length(codigo_acceso) BETWEEN 1 AND 12)) THEN RAISE EXCEPTION 'clases.codigo: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE NOT (length(anuncio)<=5000)) THEN RAISE EXCEPTION 'clases.anuncio: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE length(nombre_clase)>120) THEN RAISE EXCEPTION 'clases.nombre_clase: longitud excesiva'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE length(codigo_acceso)>12) THEN RAISE EXCEPTION 'clases.codigo_acceso: longitud excesiva'; END IF;
IF EXISTS(SELECT 1 FROM clases t LEFT JOIN usuarios p ON p.id_usuario=t.id_profesor WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'clases.id_profesor: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM inscripciones WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'inscripciones.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM inscripciones WHERE id_clase IS NULL) THEN RAISE EXCEPTION 'inscripciones.id_clase: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM inscripciones GROUP BY id_usuario,id_clase HAVING count(*)>1) THEN RAISE EXCEPTION 'inscripciones: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM inscripciones t LEFT JOIN usuarios p ON p.id_usuario=t.id_usuario WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'inscripciones.id_usuario: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM inscripciones t LEFT JOIN clases p ON p.id_clase=t.id_clase WHERE p.id_clase IS NULL) THEN RAISE EXCEPTION 'inscripciones.id_clase: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'progreso_areas.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE correo IS NULL) THEN RAISE EXCEPTION 'progreso_areas.correo: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE area IS NULL) THEN RAISE EXCEPTION 'progreso_areas.area: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE progreso IS NULL) THEN RAISE EXCEPTION 'progreso_areas.progreso: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE estado IS NULL) THEN RAISE EXCEPTION 'progreso_areas.estado: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas GROUP BY id_usuario,area HAVING count(*)>1) THEN RAISE EXCEPTION 'progreso_areas: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE NOT (area IN ('matematicas','lectura','ciencias','sociales','ingles'))) THEN RAISE EXCEPTION 'progreso_areas.area: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas WHERE NOT (progreso BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_areas.progreso: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_areas t LEFT JOIN usuarios p ON p.id_usuario=t.id_usuario WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'progreso_areas.id_usuario: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE correo IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.correo: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_matematicas IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_matematicas: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_lectura IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_lectura: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_ciencias IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_ciencias: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_sociales IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_sociales: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_ingles IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_ingles: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE progreso_global IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.progreso_global: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante GROUP BY id_usuario HAVING count(*)>1) THEN RAISE EXCEPTION 'progreso_estudiante: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_matematicas BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.matematicas: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_lectura BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.lectura: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_ciencias BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.ciencias: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_sociales BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.sociales: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_ingles BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.ingles: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante WHERE NOT (progreso_global BETWEEN 0 AND 100)) THEN RAISE EXCEPTION 'progreso_estudiante.global: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM progreso_estudiante t LEFT JOIN usuarios p ON p.id_usuario=t.id_usuario WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'progreso_estudiante.id_usuario: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM sesiones WHERE id_sesion IS NULL) THEN RAISE EXCEPTION 'sesiones.id_sesion: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM sesiones WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'sesiones.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM sesiones WHERE expira IS NULL) THEN RAISE EXCEPTION 'sesiones.expira: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM sesiones GROUP BY id_sesion HAVING count(*)>1) THEN RAISE EXCEPTION 'sesiones: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM sesiones t LEFT JOIN usuarios p ON p.id_usuario=t.id_usuario WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'sesiones.id_usuario: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE id_resultado IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.id_resultado: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE id_usuario IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.id_usuario: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE fecha IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.fecha: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE modalidad IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.modalidad: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE resultado IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.resultado: valores nulos; revisar copia sin eliminar filas'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro GROUP BY id_resultado HAVING count(*)>1) THEN RAISE EXCEPTION 'resultados_simulacro: clave primaria duplicada'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro WHERE NOT (modalidad IN ('general','area','temas'))) THEN RAISE EXCEPTION 'resultados_simulacro.modalidad: valor fuera de contrato'; END IF;
IF EXISTS(SELECT 1 FROM resultados_simulacro t LEFT JOIN usuarios p ON p.id_usuario=t.id_usuario WHERE p.id_usuario IS NULL) THEN RAISE EXCEPTION 'resultados_simulacro.id_usuario: referencia huerfana'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE lower(trim(email)) IS NOT NULL GROUP BY lower(trim(email)) HAVING count(*)>1) THEN RAISE EXCEPTION 'usuarios: valor unico duplicado'; END IF;
IF EXISTS(SELECT 1 FROM usuarios WHERE foto_nombre IS NOT NULL GROUP BY foto_nombre HAVING count(*)>1) THEN RAISE EXCEPTION 'usuarios: valor unico duplicado'; END IF;
IF EXISTS(SELECT 1 FROM clases WHERE codigo_acceso IS NOT NULL GROUP BY codigo_acceso HAVING count(*)>1) THEN RAISE EXCEPTION 'clases: valor unico duplicado'; END IF;
END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='usuarios'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE usuarios ADD PRIMARY KEY (id_usuario);
 ELSIF actual<>ARRAY['id_usuario']::text[] THEN RAISE EXCEPTION 'usuarios: PK existente incompatible'; END IF; END $$;

ALTER TABLE usuarios ALTER COLUMN nombre TYPE varchar(120);

ALTER TABLE usuarios ALTER COLUMN email TYPE varchar(254);

ALTER TABLE usuarios ALTER COLUMN password TYPE text;

ALTER TABLE usuarios ALTER COLUMN rol TYPE text;

ALTER TABLE usuarios ALTER COLUMN biografia TYPE text;

ALTER TABLE usuarios ALTER COLUMN foto_perfil TYPE text;

ALTER TABLE usuarios ALTER COLUMN foto_tipo TYPE text;

ALTER TABLE usuarios ALTER COLUMN foto_nombre TYPE text;

ALTER TABLE usuarios ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN nombre SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN email SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN password SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN rol SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN biografia SET NOT NULL;

ALTER TABLE usuarios ALTER COLUMN biografia SET DEFAULT '';

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='usuarios'::regclass AND conname='v3_usuarios_nombre') THEN ALTER TABLE usuarios ADD CONSTRAINT v3_usuarios_nombre CHECK (length(trim(nombre)) BETWEEN 1 AND 120); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='usuarios'::regclass AND conname='v3_usuarios_email') THEN ALTER TABLE usuarios ADD CONSTRAINT v3_usuarios_email CHECK (length(trim(email)) BETWEEN 1 AND 254); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='usuarios'::regclass AND conname='v3_usuarios_rol') THEN ALTER TABLE usuarios ADD CONSTRAINT v3_usuarios_rol CHECK (rol IN ('estudiante','profesor')); END IF; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='clases'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE clases ADD PRIMARY KEY (id_clase);
 ELSIF actual<>ARRAY['id_clase']::text[] THEN RAISE EXCEPTION 'clases: PK existente incompatible'; END IF; END $$;

ALTER TABLE clases ALTER COLUMN nombre_clase TYPE varchar(120);

ALTER TABLE clases ALTER COLUMN codigo_acceso TYPE varchar(12);

ALTER TABLE clases ALTER COLUMN anuncio TYPE text;

ALTER TABLE clases ALTER COLUMN id_clase SET NOT NULL;

ALTER TABLE clases ALTER COLUMN nombre_clase SET NOT NULL;

ALTER TABLE clases ALTER COLUMN id_profesor SET NOT NULL;

ALTER TABLE clases ALTER COLUMN codigo_acceso SET NOT NULL;

ALTER TABLE clases ALTER COLUMN anuncio SET NOT NULL;

ALTER TABLE clases ALTER COLUMN anuncio SET DEFAULT '';

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='clases'::regclass AND conname='v3_clases_nombre') THEN ALTER TABLE clases ADD CONSTRAINT v3_clases_nombre CHECK (length(trim(nombre_clase)) BETWEEN 1 AND 120); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='clases'::regclass AND conname='v3_clases_codigo') THEN ALTER TABLE clases ADD CONSTRAINT v3_clases_codigo CHECK (length(codigo_acceso) BETWEEN 1 AND 12); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='clases'::regclass AND conname='v3_clases_anuncio') THEN ALTER TABLE clases ADD CONSTRAINT v3_clases_anuncio CHECK (length(anuncio)<=5000); END IF; END $$;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='clases'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_profesor'
 LOOP EXECUTE format('ALTER TABLE clases DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE clases ADD CONSTRAINT v3_clases_id_profesor_fk FOREIGN KEY (id_profesor) REFERENCES usuarios(id_usuario) ON DELETE NO ACTION; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='inscripciones'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE inscripciones ADD PRIMARY KEY (id_usuario,id_clase);
 ELSIF actual<>ARRAY['id_usuario','id_clase']::text[] THEN RAISE EXCEPTION 'inscripciones: PK existente incompatible'; END IF; END $$;

ALTER TABLE inscripciones ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE inscripciones ALTER COLUMN id_clase SET NOT NULL;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='inscripciones'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_usuario'
 LOOP EXECUTE format('ALTER TABLE inscripciones DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE inscripciones ADD CONSTRAINT v3_inscripciones_id_usuario_fk FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE; END $$;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='inscripciones'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_clase'
 LOOP EXECUTE format('ALTER TABLE inscripciones DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE inscripciones ADD CONSTRAINT v3_inscripciones_id_clase_fk FOREIGN KEY (id_clase) REFERENCES clases(id_clase) ON DELETE CASCADE; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='progreso_areas'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE progreso_areas ADD PRIMARY KEY (id_usuario,area);
 ELSIF actual<>ARRAY['id_usuario','area']::text[] THEN RAISE EXCEPTION 'progreso_areas: PK existente incompatible'; END IF; END $$;

ALTER TABLE progreso_areas ALTER COLUMN correo TYPE text;

ALTER TABLE progreso_areas ALTER COLUMN area TYPE text;

ALTER TABLE progreso_areas ALTER COLUMN progreso TYPE numeric;

ALTER TABLE progreso_areas ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE progreso_areas ALTER COLUMN correo SET NOT NULL;

ALTER TABLE progreso_areas ALTER COLUMN area SET NOT NULL;

ALTER TABLE progreso_areas ALTER COLUMN progreso SET NOT NULL;

ALTER TABLE progreso_areas ALTER COLUMN estado SET NOT NULL;

ALTER TABLE progreso_areas ALTER COLUMN progreso SET DEFAULT 0;

ALTER TABLE progreso_areas ALTER COLUMN estado SET DEFAULT '{}'::jsonb;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_areas'::regclass AND conname='v3_progreso_areas_area') THEN ALTER TABLE progreso_areas ADD CONSTRAINT v3_progreso_areas_area CHECK (area IN ('matematicas','lectura','ciencias','sociales','ingles')); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_areas'::regclass AND conname='v3_progreso_areas_progreso') THEN ALTER TABLE progreso_areas ADD CONSTRAINT v3_progreso_areas_progreso CHECK (progreso BETWEEN 0 AND 100); END IF; END $$;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='progreso_areas'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_usuario'
 LOOP EXECUTE format('ALTER TABLE progreso_areas DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE progreso_areas ADD CONSTRAINT v3_progreso_areas_id_usuario_fk FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='progreso_estudiante'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE progreso_estudiante ADD PRIMARY KEY (id_usuario);
 ELSIF actual<>ARRAY['id_usuario']::text[] THEN RAISE EXCEPTION 'progreso_estudiante: PK existente incompatible'; END IF; END $$;

ALTER TABLE progreso_estudiante ALTER COLUMN correo TYPE text;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_matematicas TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_lectura TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ciencias TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_sociales TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ingles TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_global TYPE numeric;

ALTER TABLE progreso_estudiante ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN correo SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_matematicas SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_lectura SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ciencias SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_sociales SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ingles SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_global SET NOT NULL;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_matematicas SET DEFAULT 0;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_lectura SET DEFAULT 0;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ciencias SET DEFAULT 0;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_sociales SET DEFAULT 0;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_ingles SET DEFAULT 0;

ALTER TABLE progreso_estudiante ALTER COLUMN progreso_global SET DEFAULT 0;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_matematicas') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_matematicas CHECK (progreso_matematicas BETWEEN 0 AND 100); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_lectura') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_lectura CHECK (progreso_lectura BETWEEN 0 AND 100); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_ciencias') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_ciencias CHECK (progreso_ciencias BETWEEN 0 AND 100); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_sociales') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_sociales CHECK (progreso_sociales BETWEEN 0 AND 100); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_ingles') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_ingles CHECK (progreso_ingles BETWEEN 0 AND 100); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='progreso_estudiante'::regclass AND conname='v3_progreso_estudiante_global') THEN ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_global CHECK (progreso_global BETWEEN 0 AND 100); END IF; END $$;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='progreso_estudiante'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_usuario'
 LOOP EXECUTE format('ALTER TABLE progreso_estudiante DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE progreso_estudiante ADD CONSTRAINT v3_progreso_estudiante_id_usuario_fk FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='sesiones'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE sesiones ADD PRIMARY KEY (id_sesion);
 ELSIF actual<>ARRAY['id_sesion']::text[] THEN RAISE EXCEPTION 'sesiones: PK existente incompatible'; END IF; END $$;

ALTER TABLE sesiones ALTER COLUMN id_sesion SET NOT NULL;

ALTER TABLE sesiones ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE sesiones ALTER COLUMN expira SET NOT NULL;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='sesiones'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_usuario'
 LOOP EXECUTE format('ALTER TABLE sesiones DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE sesiones ADD CONSTRAINT v3_sesiones_id_usuario_fk FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE; END $$;

DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='resultados_simulacro'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE resultados_simulacro ADD PRIMARY KEY (id_resultado);
 ELSIF actual<>ARRAY['id_resultado']::text[] THEN RAISE EXCEPTION 'resultados_simulacro: PK existente incompatible'; END IF; END $$;

ALTER TABLE resultados_simulacro ALTER COLUMN id_resultado SET NOT NULL;

ALTER TABLE resultados_simulacro ALTER COLUMN id_usuario SET NOT NULL;

ALTER TABLE resultados_simulacro ALTER COLUMN fecha SET NOT NULL;

ALTER TABLE resultados_simulacro ALTER COLUMN modalidad SET NOT NULL;

ALTER TABLE resultados_simulacro ALTER COLUMN resultado SET NOT NULL;

ALTER TABLE resultados_simulacro ALTER COLUMN fecha SET DEFAULT NOW();

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='resultados_simulacro'::regclass AND conname='v3_resultados_simulacro_modalidad') THEN ALTER TABLE resultados_simulacro ADD CONSTRAINT v3_resultados_simulacro_modalidad CHECK (modalidad IN ('general','area','temas')); END IF; END $$;

DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='resultados_simulacro'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='id_usuario'
 LOOP EXECUTE format('ALTER TABLE resultados_simulacro DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE resultados_simulacro ADD CONSTRAINT v3_resultados_simulacro_id_usuario_fk FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS v3_usuarios_email ON usuarios(lower(trim(email)));

CREATE UNIQUE INDEX IF NOT EXISTS v3_usuarios_foto ON usuarios(foto_nombre);

CREATE UNIQUE INDEX IF NOT EXISTS v3_clases_codigo ON clases(codigo_acceso);

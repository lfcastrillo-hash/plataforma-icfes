// Genera solo 003. Nunca reescribe 001/002 ni conecta a una base.
const fs=require('node:fs'),model=require('./schema-contract.cjs');
const statements=['-- 003: contrato final posterior a 001 o 002. Ejecutar dentro de BEGIN/COMMIT.',
 '-- Aborta ante nulos, duplicados, longitudes o referencias inválidas. No borra ni corrige filas.',
 '-- Bloquea las siete tablas durante la comprobación y cambio para evitar carreras.',
 'LOCK TABLE '+Object.keys(model).join(', ')+' IN ACCESS EXCLUSIVE MODE;'];
const assertSQL=(condition,message)=>`IF EXISTS(${condition}) THEN RAISE EXCEPTION '${message}'; END IF;`;
const preflight=[];
for(const [table,m] of Object.entries(model)){
 for(const col of m.required)preflight.push(assertSQL(`SELECT 1 FROM ${table} WHERE ${col} IS NULL`,`${table}.${col}: valores nulos; revisar copia sin eliminar filas`));
 preflight.push(assertSQL(`SELECT 1 FROM ${table} GROUP BY ${m.pk.join(',')} HAVING count(*)>1`,`${table}: clave primaria duplicada`));
 for(const [name,expr] of Object.entries(m.checks||{}))preflight.push(assertSQL(`SELECT 1 FROM ${table} WHERE NOT (${expr})`,`${table}.${name}: valor fuera de contrato`));
 for(const [col,type] of Object.entries(m.types||{}))if(type.startsWith('varchar'))preflight.push(assertSQL(`SELECT 1 FROM ${table} WHERE length(${col})>${type.match(/\d+/)[0]}`,`${table}.${col}: longitud excesiva`));
 for(const [col,[target,id]] of Object.entries(m.fk||{}))preflight.push(assertSQL(`SELECT 1 FROM ${table} t LEFT JOIN ${target} p ON p.${id}=t.${col} WHERE p.${id} IS NULL`,`${table}.${col}: referencia huerfana`));
}
for(const [table,expr] of [['usuarios','lower(trim(email))'],['usuarios','foto_nombre'],['clases','codigo_acceso']])preflight.push(assertSQL(`SELECT 1 FROM ${table} WHERE ${expr} IS NOT NULL GROUP BY ${expr} HAVING count(*)>1`,`${table}: valor unico duplicado`));
statements.push('DO $$ BEGIN\n'+preflight.join('\n')+'\nEND $$;');
for(const [table,m] of Object.entries(model)){
 // Verificar PK preexistente: no quitar dependencias desconocidas ni usar CASCADE.
 statements.push(`DO $$ DECLARE actual text[]; BEGIN
 SELECT array_agg(a.attname::text ORDER BY k.ord) INTO actual FROM pg_constraint c
 CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(num,ord)
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num
 WHERE c.conrelid='${table}'::regclass AND c.contype='p';
 IF actual IS NULL THEN ALTER TABLE ${table} ADD PRIMARY KEY (${m.pk.join(',')});
 ELSIF actual<>ARRAY[${m.pk.map(c=>"'"+c+"'").join(',')}]::text[] THEN RAISE EXCEPTION '${table}: PK existente incompatible'; END IF; END $$;`);
 for(const [col,type] of Object.entries(m.types||{}))statements.push(`ALTER TABLE ${table} ALTER COLUMN ${col} TYPE ${type};`);
 for(const col of m.required)statements.push(`ALTER TABLE ${table} ALTER COLUMN ${col} SET NOT NULL;`);
 for(const [col,value] of Object.entries(m.defaults||{}))statements.push(`ALTER TABLE ${table} ALTER COLUMN ${col} SET DEFAULT ${value};`);
 for(const [name,expr] of Object.entries(m.checks||{})){
  const cname='v3_'+table+'_'+name;
  statements.push(`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='${table}'::regclass AND conname='${cname}') THEN ALTER TABLE ${table} ADD CONSTRAINT ${cname} CHECK (${expr}); END IF; END $$;`);
 }
 for(const [col,[target,id,del]] of Object.entries(m.fk||{}))statements.push(`DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
 WHERE c.conrelid='${table}'::regclass AND c.contype='f' AND cardinality(c.conkey)=1 AND a.attname='${col}'
 LOOP EXECUTE format('ALTER TABLE ${table} DROP CONSTRAINT %I',fk.conname); END LOOP;
 ALTER TABLE ${table} ADD CONSTRAINT v3_${table}_${col}_fk FOREIGN KEY (${col}) REFERENCES ${target}(${id}) ON DELETE ${del}; END $$;`);
}
statements.push('CREATE UNIQUE INDEX IF NOT EXISTS v3_usuarios_email ON usuarios(lower(trim(email)));',
 'CREATE UNIQUE INDEX IF NOT EXISTS v3_usuarios_foto ON usuarios(foto_nombre);',
 'CREATE UNIQUE INDEX IF NOT EXISTS v3_clases_codigo ON clases(codigo_acceso);');
fs.writeFileSync('backend/migrations/003_contrato_final.sql',statements.join('\n\n')+'\n');

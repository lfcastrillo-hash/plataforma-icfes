# Preparación final OIDC y publicación controlada — 22/11/2026

Este informe sustituye la secuencia anterior de publicación por push. No se ha publicado la rama ni creado un PR. Se conserva 84c9bc1 y sus antecesores.

## Diagnóstico

- Automatic Analysis desactivado, OIDC activado y exclusión Vercel configurada en plataforma-icfes-backend, plataforma-icfes y plataforma-icfes-zivu: confirmados por el usuario, no verificados desde sus paneles en esta revisión.
- La rama remota ci/sonar-oidc-validation no existe según git ls-remote. La rama local de trabajo sigue siendo codex/sonar-metricas-20261122. No se puede afirmar que una rama remota inexistente ya contiene los cambios: se publicará HEAD exactamente en esa ref cuando se autorice.
- Free admite análisis de main y PR cuyo destino es main. OSS/Team tienen otras capacidades. Para Free se sustituye el trigger push por pull_request hacia main. El borrador es una medida de revisión, no un requisito de Sonar. No hace falta fusionarlo ni modificar main.
- Solo se admite el head ci/sonar-oidc-validation del mismo repositorio; forks y otras ramas no ejecutan el job. Se incluyen opened/synchronize/reopened/ready_for_review y no se excluyen borradores. Se usa pull_request, nunca pull_request_target. Se analiza el SHA del head, con historial completo. GitHub expone el contexto PR al scanner para detectar número/base/head sin fingir main.
- El push futuro publica el código, pero ya NO ejecuta este workflow. La creación posterior del PR en borrador activa el análisis. No se depende de workflow_dispatch ni de instalar el workflow en main. Un conflicto de merge bloquea el evento PR: debe revisarse localmente, sin modificar main.
- Acciones oficiales auth@v1 y scan@v8; permisos contents: read e id-token: write; Linux ubuntu-latest, Node 24; sin secreto fijo SONAR_TOKEN. La acción exporta una credencial efímera para el scanner.
- npm ci en raíz y backend no tiene scripts de despliegue/migración propios. test:coverage ejecuta pruebas locales con PGlite y genera LCOV. Las fixtures sí cargan backend/migrations/001_esquema.sql en una BD WASM temporal aislada: no se ejecutan migraciones sobre Supabase ni bases persistentes. No hay credenciales de producción en el job.
- Se conserva .sonarcloud.properties, fuentes/exclusiones y Gate original. El override LCOV apunta al reporte del mismo job. Las 104 pruebas y el LCOV de 26 archivos/685 líneas fueron ejecutados en el lote anterior; en esta revisión se revalida el LCOV y YAML, sin afirmar una nueva ejecución Linux ni cobertura global.
- Los archivos no rastreados de evidencias permanecen locales y no viajan con git push. No usar git add . ni incluir directorios temporales. Los reportes JSON/XML/TXT/LCOV ya versionados son evidencias intencionales. La plantilla backend/.env.example contiene datos ficticios de localhost y JWT_SECRET vacío; no es un .env de producción.
- main local y remoto no se modifican. El remoto main consultado sigue en cbf45e85ac1f3a50a1520f23374eea54a1a99416. No hay modificaciones en PDF, SQL de migraciones ni vercel.json en este lote. La ausencia de despliegues futuros depende de la exclusión Vercel confirmada por el usuario; un PR en borrador por sí solo no bloquea Vercel.

## Comandos futuros — solo con autorización expresa

Desde PowerShell, en work/prepicfes-calidad:

```powershell
git branch --show-current
git status --short --branch
git log -1 --oneline
git merge-base --is-ancestor 84c9bc1 HEAD
# Debe terminar con código 0.
git ls-remote --heads origin main ci/sonar-oidc-validation
git diff --check
git log --oneline origin/main..HEAD
```

Revisar que main no avanzó respecto a la referencia registrada y que no existe la rama remota. Si existe o main avanzó, detenerse y revisar antes de publicar. No hacer force push. Confirmar también las exclusiones Vercel en los tres proyectos antes de crear rama o PR.

```powershell
git push origin HEAD:refs/heads/ci/sonar-oidc-validation
```

Este comando no cambia main ni requiere cambiar la rama local. Verificar que el SHA remoto coincide con git rev-parse HEAD:

```powershell
git rev-parse HEAD
git ls-remote --heads origin ci/sonar-oidc-validation
```

Después, usando GitHub CLI instalado y autenticado (no se verificó su disponibilidad en esta sesión):

```powershell
gh pr create --repo lfcastrillo-hash/plataforma-icfes --base main --head ci/sonar-oidc-validation --draft --title "Validar calidad PrepICFES mediante OIDC" --body "Validación de SonarQube Cloud con OIDC y LCOV. Mantener en borrador; no fusionar ni desplegar."
gh run list --repo lfcastrillo-hash/plataforma-icfes --branch ci/sonar-oidc-validation --event pull_request --limit 5
gh run watch RUN_ID --repo lfcastrillo-hash/plataforma-icfes --exit-status
```

Sustituir RUN_ID por el real. Alternativa sin CLI: abrir https://github.com/lfcastrillo-hash/plataforma-icfes/compare/main...ci/sonar-oidc-validation y seleccionar Create draft pull request. Luego abrir Actions > SonarQube Cloud OIDC. No activar auto-merge ni pulsar Merge. Las futuras actualizaciones autorizadas al head disparan synchronize; rerun del mismo análisis no requiere otro push.

## Evidencia remota que faltará obtener

Comprobar autenticación OIDC, 104 pruebas, validación/importación LCOV sin advertencias de rutas, SHA analizado, tarea Compute Engine y resultado oficial del Gate del PR. El análisis PR evalúa código nuevo y no reemplaza el análisis global de main; no permite declarar actualizadas las 371 incidencias generales ni el Gate histórico de main. No se atribuye éxito remoto a la validación estática.

## Fuentes oficiales

- https://github.com/SonarSource/sonarqube-auth-action
- https://github.com/SonarSource/sonarqube-scan-action/blob/v8/action.yml
- https://docs.sonarsource.com/sonarqube-cloud/administering-sonarcloud/managing-subscription/subscription-plans
- https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/pull-request-analysis
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request

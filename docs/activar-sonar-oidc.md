# Activación autorizada del análisis OIDC

El workflow local se adaptó al ejemplo oficial de SonarSource consultado el 22/11/2026: auth-action@v1 y scan-action@v8. Se conservan checkout@v4 y setup-node@v4, compatibles con el runner hospedado Linux y Node 24 instalado para las pruebas. No se añadieron dependencias al producto.

## Autenticación y configuración

Permisos: contents: read e id-token: write. auth-action se ejecuta inmediatamente antes del scanner. Solicita el proyecto lfcastrillo-hash_plataforma-icfes en la región EU y entrega organization y project-key al scanner mediante sus outputs. No se requiere SONAR_TOKEN ni SONAR_ORGANIZATION almacenados en GitHub. Internamente la acción exporta SONAR_TOKEN temporal al entorno: esto es parte del protocolo oficial, no una credencial fija incluida en el archivo. No se imprime ni se persiste.

Se conserva project.settings=.sonarcloud.properties, origen sonarcloud.io, fuentes y exclusiones originales, generación de cobertura, validación del LCOV y espera del Quality Gate. La ruta LCOV se sobreescribe únicamente para usar .qa-sonar/pruebas-unitarias/lcov.info, generado en el mismo job. No se toca ninguna regla, condición de Gate o umbral. Un Gate fallido hará fallar el job; una autenticación correcta no implica aprobación del Gate.

La habilitación de Secretless Analysis fue confirmada por el usuario. Aún debe verificarse el vínculo repositorio-proyecto y que CI-based Analysis no compita con Automatic Analysis. Esta preparación no cambió esos ajustes del servidor. El soporte del plan para análisis de la rama de validación también debe comprobarse; no se fuerza sonar.branch.name=main para eludirlo.

## Por qué existe una rama remota exclusiva

El workflow no existe en origin/main. GitHub exige que el archivo esté en la rama predeterminada para workflow_dispatch; por eso no se promete que aparezca ahora el botón Run workflow. El evento push se limita exactamente a ci/sonar-oidc-validation para permitir la primera ejecución sin editar main. Un push a codex/sonar-metricas-20261122 no lo dispara. No se configuraron pull_request, pull_request_target, schedule ni triggers de despliegue.

El job acepta solo la rama de validación o la rama local de calidad para un eventual dispatch. La concurrencia agrupa por ref y no cancela un scanner en curso. En esta revisión hay un único archivo en .github/workflows, sin otro job que compita. Esto no controla la integración Git de Vercel.

## Secuencia exacta futura, solo después de autorización

1. Confirmar acceso Actions habilitado, vinculación del repositorio con el proyecto Sonar y Secretless Analysis habilitado. Confirmar CI-based Analysis y soporte de la rama. No crear un secreto SONAR_TOKEN.
2. ANTES del primer push, evitar despliegues de TODOS los proyectos Vercel conectados al repositorio. Una opción es desconectarlos temporalmente desde Settings > Git > Connected Git Repository > Disconnect, únicamente con aprobación del propietario. No usar Ignored Build Step como garantía de ausencia de despliegues: puede crear ejecuciones canceladas.
3. Como alternativa autorizada a la desconexión, integrar en la configuración Vercel efectiva de cada proyecto una prohibición exacta para ci/sonar-oidc-validation. El objeto que debe fusionarse, conservando builds/routes/includeFiles, es:

```json
{"git":{"deploymentEnabled":{"ci/sonar-oidc-validation":false}}}
```

Verificar que ninguna regla coincidente true la anule y que la configuración aplique a las raíces de todos los proyectos conectados. No publicar si esa protección no está confirmada. El vercel.json real NO fue modificado por esta tarea.

4. En la carpeta work/prepicfes-calidad, confirmar rama, estado y SHA a analizar. Si se elige el bloqueo por archivo Vercel, revisar y confirmar su cambio en un commit local antes de publicar. Estos son comandos futuros, no ejecutados:

```powershell
git status --short --branch
git branch --show-current
git log -1 --oneline
git ls-remote --heads origin refs/heads/ci/sonar-oidc-validation
```

Si la rama remota ya existe, revisar primero su historial; no utilizar force ni reemplazar trabajo ajeno. Si no existe y el propietario autoriza explícitamente push y análisis:

```powershell
git push origin HEAD:refs/heads/ci/sonar-oidc-validation
```

Este único push crea la rama remota y dispara el workflow por su evento push. No modifica main. No abrir PR como paso previo, porque podría activar integraciones de Preview.

5. Abrir Actions > SonarQube Cloud OIDC, seleccionar la ejecución de ci/sonar-oidc-validation y comprobar: instalación, pruebas, LCOV, Authenticate with GitHub OIDC y scanner. También se puede observar con GitHub CLI:

```powershell
gh run list --repo lfcastrillo-hash/plataforma-icfes --branch ci/sonar-oidc-validation --limit 5
gh run watch RUN_ID --repo lfcastrillo-hash/plataforma-icfes --exit-status
```

Sustituir RUN_ID por el identificador real. Para repetir el mismo commit autorizado sin otro push:

```powershell
gh run rerun RUN_ID --repo lfcastrillo-hash/plataforma-icfes
```

No confundir esta repetición con analizar cambios locales nuevos. Los cambios nuevos requieren publicación autorizada a esa rama, que volverá a activar el evento push.

6. Registrar commit evaluado, URL de Actions, URL/tarea Compute Engine e identificador del análisis. Confirmar el Gate y la importación de LCOV en ese análisis exacto. Si el plan rechaza ramas, informar el impedimento: no cambiar main ni la rama principal del proyecto Sonar para sortearlo.

## Verificaciones y límites

El archivo se comprobó con actionlint 1.7.12 (binario del release oficial, SHA-256 cotejado con checksums del mismo release), validando YAML y expresiones Actions. La comprobación es estática; no valida OIDC real ni una ejecución Linux. Las pruebas locales usan PostgreSQL WASM temporal, no Supabase. El PDF académico y la configuración de Vercel permanecen intactos. No se publicó ni ejecutó un análisis remoto.

Resultado local: 104 pruebas aprobadas y 0 fallidas. LCOV validado: 26 archivos y 685 líneas instrumentadas; corresponde al ámbito ejecutado, no a la cobertura global del repositorio. actionlint terminó con código 0. Los detalles y la huella del workflow están en docs/sonar-evidencias/oidc-verificaciones.json.

## Fuentes oficiales

- https://github.com/SonarSource/sonarqube-auth-action
- https://github.com/SonarSource/sonarqube-auth-action/blob/v1/action.yml
- https://github.com/SonarSource/sonarqube-scan-action/blob/v8/action.yml
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/project-configuration/git-settings

$ErrorActionPreference='Stop'
# Solo el contenedor exclusivo creado por compose.native-test.yml; no instala herramientas.
$sslTool='C:\Program Files\Git\usr\bin\openssl.exe'
if(!(Test-Path -LiteralPath $sslTool)){throw 'OpenSSL de Git no disponible; no se instalará automáticamente.'}
if(Test-Path -LiteralPath '.qa-native/ca.key'){throw 'Ya hay material TLS local. No se sobrescribirá.'}
function Invoke-LocalOpenSsl {
 $previousPreference=$ErrorActionPreference
 try {$ErrorActionPreference='Continue'; & $sslTool @args 2>$null; if($LASTEXITCODE){throw 'OpenSSL local terminó con error'}}
 finally {$ErrorActionPreference=$previousPreference}
}
function Invoke-LocalDocker {& docker @args; if($LASTEXITCODE){throw 'Docker local terminó con error'}}
Invoke-LocalOpenSsl req -x509 -newkey rsa:2048 -nodes -keyout .qa-native/ca.key -out .qa-native/ca.crt -days 30 -subj '/CN=PrepICFES Local QA CA'
Invoke-LocalOpenSsl req -newkey rsa:2048 -nodes -keyout .qa-native/server.key -out .qa-native/server.csr -subj '/CN=localhost'
[IO.File]::WriteAllText((Join-Path (Get-Location) '.qa-native/server.ext'),"subjectAltName=DNS:localhost,IP:127.0.0.1`nextendedKeyUsage=serverAuth`n")
Invoke-LocalOpenSsl x509 -req -in .qa-native/server.csr -CA .qa-native/ca.crt -CAkey .qa-native/ca.key -CAcreateserial -out .qa-native/server.crt -days 30 -extfile .qa-native/server.ext
Invoke-LocalOpenSsl req -x509 -newkey rsa:2048 -nodes -keyout .qa-native/wrong-ca.key -out .qa-native/wrong-ca.crt -days 30 -subj '/CN=Untrusted QA CA'
Invoke-LocalDocker cp .qa-native/server.key prepicfes-native-20261115:/var/lib/postgresql/data/qa-server.key
Invoke-LocalDocker cp .qa-native/server.crt prepicfes-native-20261115:/var/lib/postgresql/data/qa-server.crt
Invoke-LocalDocker exec -u root prepicfes-native-20261115 sh -c 'chown postgres:postgres /var/lib/postgresql/data/qa-server.key /var/lib/postgresql/data/qa-server.crt && chmod 600 /var/lib/postgresql/data/qa-server.key'
Invoke-LocalDocker exec prepicfes-native-20261115 psql -U prepicfes_migrator -d prepicfes_native_test -c 'ALTER SYSTEM SET ssl = on'
Invoke-LocalDocker exec prepicfes-native-20261115 psql -U prepicfes_migrator -d prepicfes_native_test -c "ALTER SYSTEM SET ssl_cert_file = 'qa-server.crt'"
Invoke-LocalDocker exec prepicfes-native-20261115 psql -U prepicfes_migrator -d prepicfes_native_test -c "ALTER SYSTEM SET ssl_key_file = 'qa-server.key'"
Invoke-LocalDocker exec prepicfes-native-20261115 psql -U prepicfes_migrator -d prepicfes_native_test -c 'SELECT pg_reload_conf()'

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot"
$jarPath = "$PSScriptRoot\target\product-tracker-1.0.0.jar"
& "$env:JAVA_HOME\bin\java.exe" -jar $jarPath `
  --server.port=4000 `
  --spring.datasource.url=jdbc:postgresql://127.0.0.1:5432/product_tracker `
  --spring.datasource.username=postgres `
  --spring.datasource.password=1234 `
  --app.jwt.secret=pt_internal_dev_secret_key_2024 `
  --app.jwt.expiration=604800000 `
  --app.cors.origin=http://localhost:5173

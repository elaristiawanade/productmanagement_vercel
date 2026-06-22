@echo off
setlocal EnableDelayedExpansion
set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend-java"
set "STATIC=%BACKEND%\src\main\resources\static"
set "MVN=C:\tools\maven-extracted\apache-maven-3.9.6\bin\mvn.cmd"

echo.
echo ============================================
echo  Product Tracker - Build for Deployment
echo ============================================
echo.

echo [1/3] Building frontend...
cd /d "%FRONTEND%"
call npm install --silent
if errorlevel 1 ( echo ERROR: npm install failed & goto :fail )
call npm run build
if errorlevel 1 ( echo ERROR: npm run build failed & goto :fail )
echo     OK - dist/ created

echo.
echo [2/3] Embedding frontend into backend static...
if exist "%STATIC%" rmdir /s /q "%STATIC%"
xcopy /E /I /Y /Q "%FRONTEND%\dist" "%STATIC%"
if errorlevel 1 ( echo ERROR: xcopy failed & goto :fail )
echo     OK - static/ populated

echo.
echo [3/3] Building backend JAR...
cd /d "%BACKEND%"
call "%MVN%" clean package -DskipTests -q
if errorlevel 1 ( echo ERROR: Maven build failed & goto :fail )
echo     OK - target\product-tracker-1.0.0.jar

echo.
echo ============================================
echo  BUILD COMPLETE
echo ============================================
echo.
echo  JAR    : backend-java\target\product-tracker-1.0.0.jar
echo  Start  : start.bat  (or java -jar ...)
echo.
goto :end

:fail
echo.
echo ============================================
echo  BUILD FAILED
echo ============================================
endlocal
exit /b 1

:end
endlocal

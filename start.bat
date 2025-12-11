@echo off
REM FIFA 2026 App - Start Script (Windows)
REM Ova skripta automatski pokreće frontend i backend

echo 🏆 FIFA 2026 App - Pokretanje...
echo.

REM Provjeri da li smo u pravom direktoriju
if not exist "package.json" (
    echo ❌ Greška: package.json nije pronađen. Provjeri da si u fifa2026-app direktoriju.
    pause
    exit /b 1
)

REM Provjeri da li su dependencies instalirani
if not exist "node_modules" (
    echo 📦 Instalacija dependencies...
    call npm install
    echo.
)

echo 🚀 Pokretanje aplikacije...
echo.
echo 📡 Backend: http://localhost:3001
echo 🌐 Frontend: http://localhost:5173
echo.
echo Pritisni Ctrl+C za zaustavljanje...
echo.

REM Pokreni aplikaciju
call npm start


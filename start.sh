#!/bin/bash

# FIFA 2026 App - Start Script
# Ova skripta automatski pokreće frontend i backend

echo "🏆 FIFA 2026 App - Pokretanje..."
echo ""

# Provjeri da li smo u pravom direktoriju
if [ ! -f "package.json" ]; then
    echo "❌ Greška: package.json nije pronađen. Provjeri da si u fifa2026-app direktoriju."
    exit 1
fi

# Provjeri da li su dependencies instalirani
if [ ! -d "node_modules" ]; then
    echo "📦 Instalacija dependencies..."
    npm install
    echo ""
fi

# Provjeri da li portovi su zauzeti
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 je već zauzet. Zaustavi postojeći proces ili promijeni port."
    echo "   Možeš koristiti: lsof -ti:3001 | xargs kill -9"
    exit 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 5173 je već zauzet. Vite će automatski koristiti sljedeći slobodan port."
fi

echo "🚀 Pokretanje aplikacije..."
echo ""
echo "📡 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Pritisni Ctrl+C za zaustavljanje..."
echo ""

# Pokreni aplikaciju
npm start


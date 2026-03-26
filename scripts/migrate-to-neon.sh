#!/bin/bash
# =============================================================================
# Migration PostgreSQL VPS → Neon
# Atelier Art Royal
# =============================================================================
#
# Usage (depuis le VPS) :
#   1. Copier ce script sur le VPS
#   2. chmod +x migrate-to-neon.sh
#   3. ./migrate-to-neon.sh "postgresql://user:pass@ep-xxx.neon.tech/artroyal_db?sslmode=require"
#
# =============================================================================

set -e

NEON_URL="$1"

if [ -z "$NEON_URL" ]; then
  echo "❌ Usage: $0 <NEON_DATABASE_URL>"
  echo "   Exemple: $0 \"postgresql://artroyal_owner:xxxxx@ep-xxxx.eu-west-2.aws.neon.tech/artroyal_db?sslmode=require\""
  exit 1
fi

echo "=========================================="
echo "  Migration Atelier Art Royal → Neon"
echo "=========================================="

# --- Étape 1 : Export depuis le container Docker VPS ---
echo ""
echo "📦 Étape 1 : Export de la base depuis Docker..."

DUMP_FILE="/tmp/artroyal_dump_$(date +%Y%m%d_%H%M%S).sql"

docker exec prospection_postgres pg_dump \
  -U artroyal \
  -d artroyal_db \
  --no-owner \
  --no-privileges \
  --no-comments \
  --if-exists \
  --clean \
  --format=plain \
  > "$DUMP_FILE"

echo "✅ Export terminé : $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

# --- Étape 2 : Test de connexion Neon ---
echo ""
echo "🔗 Étape 2 : Test de connexion à Neon..."

if psql "$NEON_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Connexion Neon OK"
else
  echo "❌ Impossible de se connecter à Neon. Vérifiez l'URL."
  echo "   Avez-vous installé psql ? → sudo apt install postgresql-client"
  exit 1
fi

# --- Étape 3 : Import dans Neon ---
echo ""
echo "🚀 Étape 3 : Import dans Neon..."

psql "$NEON_URL" < "$DUMP_FILE" 2>&1 | tail -5

echo ""
echo "✅ Import terminé !"

# --- Étape 4 : Vérification ---
echo ""
echo "📊 Étape 4 : Vérification des données..."

psql "$NEON_URL" -c "
SELECT 'users' as table_name, count(*) FROM users
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'rites', count(*) FROM rites
UNION ALL SELECT 'obediences', count(*) FROM obediences
ORDER BY table_name;
"

echo ""
echo "=========================================="
echo "  ✅ Migration terminée avec succès !"
echo "=========================================="
echo ""
echo "Prochaines étapes :"
echo "  1. Mettre à jour DATABASE_URL sur Vercel :"
echo "     → Dashboard Vercel → Settings → Environment Variables"
echo "     → DATABASE_URL = $NEON_URL"
echo "  2. Redéployer sur Vercel"
echo "  3. Mettre à jour le .env du VPS (/home/gilles/artroyal-api/.env)"
echo "     → DATABASE_URL=$NEON_URL"
echo "  4. Redémarrer le serveur VPS : pm2 restart all"
echo "  5. Tester le login sur artroyal.fr"
echo ""
echo "⚠️  Une fois tout validé, vous pourrez fermer le port 5432 sur le VPS."

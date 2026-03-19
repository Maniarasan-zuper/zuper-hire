#!/usr/bin/env bash
set -e

echo "==> Installing dependencies..."
npm install

echo "==> Building Next.js app..."
npm run build

echo "==> Seeding database with sample questions..."
# DB tables are auto-created when the app first imports db.js (on build/start).
# Run seed scripts to populate the question pool and sample campaigns.
node --input-type=module <<'EOF'
import('./migrateAndSeed.js').catch(e => { console.error(e); process.exit(1); });
EOF

node --input-type=module <<'EOF'
import('./seed.js').catch(e => { console.error(e); process.exit(1); });
EOF

echo "==> Starting app with PM2 on port 3131..."
pm2 delete zuper-hire 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✓ App is running at http://localhost:3131"
echo "  Admin login: /admin"
echo "  Default credentials: superadmin / superadmin123"
echo ""
echo "  Useful PM2 commands:"
echo "    pm2 logs zuper-hire    — view logs"
echo "    pm2 restart zuper-hire — restart"
echo "    pm2 stop zuper-hire    — stop"

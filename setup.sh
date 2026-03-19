#!/usr/bin/env bash
set -e

# ── Ensure we're using Node >= 20 via nvm ──────────────────────────────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
    nvm use 20 2>/dev/null || nvm install 20
else
    echo "Warning: nvm not found. Make sure Node >= 20 is active."
fi

NODE_BIN=$(which node)
echo "==> Using Node: $NODE_BIN ($(node -v))"

echo "==> Installing dependencies..."
npm install

echo "==> Building Next.js app..."
npm run build

echo "==> Seeding database with sample questions..."
node --input-type=module <<'EOF'
import('./migrateAndSeed.js').catch(e => { console.error(e); process.exit(1); });
EOF

node --input-type=module <<'EOF'
import('./seed.js').catch(e => { console.error(e); process.exit(1); });
EOF

echo "==> Starting app with PM2 on port 3131..."
pm2 delete zuper-hire 2>/dev/null || true
NODE_PATH="$NODE_BIN" pm2 start ecosystem.config.cjs
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

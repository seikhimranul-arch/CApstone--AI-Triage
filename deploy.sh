#!/bin/bash
# deploy.sh - Deploy SehatAI to Netlify + Railway

set -e

echo "🚀 SehatAI Deployment Script"
echo "============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-your-site-id}"
RAILWAY_PROJECT_ID="${RAILWAY_PROJECT_ID:-your-project-id}"
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-your-project-id}"

echo -e "${YELLOW}Step 1: Building Frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

echo -e "${GREEN}✓ Frontend build complete${NC}"

echo -e "${YELLOW}Step 2: Deploying to Netlify...${NC}"
# Deploy to Netlify
npx netlify deploy --prod --dir=frontend/out --site=$NETLIFY_SITE_ID

echo -e "${GREEN}✓ Netlify deployment complete${NC}"

echo -e "${YELLOW}Step 3: Deploying API to Railway...${NC}"
# Deploy API to Railway
cd api
railway up --project=$RAILWAY_PROJECT_ID
cd ..

echo -e "${GREEN}✓ Railway deployment complete${NC}"

echo -e "${YELLOW}Step 4: Running Supabase Migrations...${NC}"
# Run Supabase migrations
supabase db push --project-ref $SUPABASE_PROJECT_ID

echo -e "${GREEN}✓ Supabase migrations complete${NC}"

echo -e "${YELLOW}Step 5: Seeding Demo Data...${NC}"
# Seed demo data
python3 -c "
import asyncio
from supabase import create_client
import os

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

# Seed demo patients
patients = [
    {'name': 'Ravi Kumar', 'age': 57, 'gender': 'M', 'abha_id': '12345678901234', 'phc_id': 1},
    {'name': 'Priya Sharma', 'age': 35, 'gender': 'F', 'abha_id': '23456789012345', 'phc_id': 1},
    {'name': 'Amit Patel', 'age': 42, 'gender': 'M', 'abha_id': '34567890123456', 'phc_id': 2},
]

for p in patients:
    supabase.table('patients').upsert(p).execute()

print('Demo patients seeded')
"

echo -e "${GREEN}✓ Demo data seeded${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "============================="
echo -e "Frontend: ${GREEN}https://your-app.netlify.app${NC}"
echo -e "API: ${GREEN}https://your-api.railway.app${NC}"
echo -e "Supabase: ${GREEN}https://app.supabase.com/project/${SUPABASE_PROJECT_ID}${NC}"
echo ""
echo "Test accounts:"
echo "  Doctor: dr.rajesh@phc.gov.in"
echo "  Nurse: nurse.priya@phc.gov.in"
echo "  ASHA: asha.sunita@phc.gov.in"
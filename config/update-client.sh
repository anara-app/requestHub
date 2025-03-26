#!/bin/bash
eval `ssh-agent -s`
ssh-add ~/.ssh/id_rsa_github
cd auction/packages/client
git pull origin main
pnpm i
pnpm build
pm2 restart CLIENT
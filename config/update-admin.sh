#!/bin/bash
eval `ssh-agent -s`
ssh-add ~/.ssh/id_github
cd 24.kg/packages/admin
git pull origin main
pnpm i
pnpm build
sudo rm -r /var/www/admin/*
sudo mv /root/24.kg/packages/admin/dist/* /var/www/admin/

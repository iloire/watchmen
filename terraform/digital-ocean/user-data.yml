#!/bin/bash
sudo apt-get update
sudo apt-get install -y build-essential git nginx make libc6-dev
# Temp nginx placeholder:
sudo echo "Installing droplet for watchmen..." > /usr/share/nginx/html/index.html

# Installing node:
git clone https://github.com/nodejs/node.git /node
cd /node
git checkout v4.4.1
./configure
make
sudo make install

# Installing redis:
curl -sSL http://download.redis.io/releases/redis-stable.tar.gz -o /tmp/redis.tar.gz
mkdir -p /tmp/redis
tar -xzf /tmp/redis.tar.gz -C /tmp/redis --strip-components=1
make -C /tmp/redis
make -C /tmp/redis install
echo -n | /tmp/redis/utils/install_server.sh
rm -rf /tmp/redis*
# See: http://redis.io/topics/faq
sysctl vm.overcommit_memory=1
# Bind Redis to localhost. Comment out to make available externally.
sed -ie 's/# bind 127.0.0.1/bind 127.0.0.1/g' /etc/redis/6379.conf
service redis_6379 restart

# We need to create swap space so npm install doesn't get killed in a 512Mb droplet
sudo fallocate -l 2G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# configure nginx
sudo echo "server { listen 80; location / { proxy_pass    http://127.0.0.1:3000/; } }" > /etc/nginx/sites-available/default
sudo /etc/init.d/nginx restart

# Install pm2 process management
sudo npm install -g pm2

# Add non-root user
useradd watchmen
mkdir /home/watchmen
chown watchmen:watchmen /home/watchmen

# Configure pm2 startup
pm2 startup linux -u watchmen --hp /home/watchmen

sudo su watchmen
export HOME=/home/watchmen # needed by pm2

# Installing watchmen:
cd /home/watchmen
git clone https://github.com/iloire/watchmen.git watchmen-app
cd /home/watchmen/watchmen-app
npm install

export NODE_ENV=production
export WATCHMEN_REDIS_PORT_PRODUCTION=6379

# Watchmen private config
export WATCHMEN_BASE_URL="http://watchmen-demo.letsnode.com/" # <FILL_YOUR_OWN>
export WATCHMEN_ADMINS="<FILL_YOUR_OWN>"
export WATCHMEN_WEB_PORT=3000
export WATCHMEN_GOOGLE_CLIENT_ID="<FILL_YOUR_OWN>"
export WATCHMEN_GOOGLE_CLIENT_SECRET="<FILL_YOUR_OWN>"
export WATCHMEN_GOOGLE_ANALYTICS_ID="<FILL_YOUR_OWN>"

# Notifications
export WATCHMEN_NOTIFICATIONS_AWS_SES_ENABLED='true'
export WATCHMEN_AWS_FROM='<FILL_YOUR_OWN>'
export WATCHMEN_AWS_REGION='us-east-1'
export WATCHMEN_AWS_KEY='<FILL_YOUR_OWN>'
export WATCHMEN_AWS_SECRET='<FILL_YOUR_OWN>'

# Run services:
pm2 start run-monitor-server.js
pm2 start run-web-server.js
pm2 save

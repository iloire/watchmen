FROM node:0.10

WORKDIR /watchmen

# Installs dependencies first
ADD package.json bower.json /watchmen/
RUN set -x \
 && npm install -g bower \
 && npm install \
 && bower install --allow-root

# Add all the project
ADD . /watchmen

ENV WATCHMEN_WEB_PORT=3000

EXPOSE 3000

# Dockerfile for consumers service

FROM node:6.9.5

MAINTAINER Tony Mutai <tony@gebeya.com>

ADD . /home/auth

WORKDIR /home/auth

RUN npm install

EXPOSE 8020

ENTRYPOINT ["node", "app.js"]

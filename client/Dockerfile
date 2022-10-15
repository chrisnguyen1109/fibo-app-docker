FROM node:16-alpine as builder

USER node

RUN mkdir -p /home/node/app

RUN chown node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package.json ./

COPY --chown=node:node yarn.lock ./

RUN yarn

COPY --chown=node:node . ./

RUN yarn build

FROM nginx

EXPOSE 3000

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /home/node/app/build /usr/share/nginx/html
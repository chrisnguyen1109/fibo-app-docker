FROM node:16-alpine

USER node

RUN mkdir -p /home/node/app

RUN chown node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package.json ./

COPY --chown=node:node yarn.lock ./

RUN yarn

COPY --chown=node:node . ./

EXPOSE 3001

RUN yarn build

CMD [ "yarn", "start" ]

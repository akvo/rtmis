## First stage
FROM node:16.0.0 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json /usr/src/app/package.json
COPY . /usr/src/app
RUN npm install mini-css-extract-plugin@2.4.6
RUN yarn install
RUN yarn build

## Second stage
FROM nginx
COPY  --from=builder /usr/src/app/build /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

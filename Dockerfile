FROM mhart/alpine-node:6.2

RUN adduser -D runner

RUN apk add --no-cache libc6-compat ansible && rm -rf /var/cache/apk/* /root/.cache

WORKDIR /home/runner
COPY package.json /home/runner/
RUN npm install

COPY ansible.cfg fs.proto server.js tasks startup.sh /home/runner/

COPY fs.proto /api/main.proto

RUN chown -R runner /home/runner

USER runner

CMD ["sh", "startup.sh"]

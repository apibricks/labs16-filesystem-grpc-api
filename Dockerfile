FROM ubuntu:16.04

RUN useradd -m runner

RUN apt-get update && apt-get install -y ansible python-pip curl
RUN pip install -U boto

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get update && apt-get install -y nodejs

WORKDIR /home/runner
COPY package.json /home/runner/
RUN npm install

COPY ansible.cfg fs.proto server.js tasks /home/runner/

COPY fs.proto /api/main.proto

RUN chown -R runner /home/runner

USER runner

CMD ["node", "server.js"]

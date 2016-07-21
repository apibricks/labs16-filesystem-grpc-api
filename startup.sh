#!/bin/sh

## Passed environment variables
# SSH_HOST
# SSH_PORT
# SSH_USER
# SSH_KEY
# SUDO
# SUDO_PASS
# SUDO_USER
# ALLOW_EXEC

mkdir ~/.ssh
echo "$SSH_KEY" > ~/.ssh/id_dsa
chmod go-r ~/.ssh/*

echo "$SSH_HOST ansible_python_interpreter=/usr/bin/python2" > hosts

## Start server
node server.js

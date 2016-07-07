#!/bin/sh

## Passed environment variables
# SSH_HOST
# SSH_PORT
# SSH_USER
# SSH_KEY
# BASE_PATH
# SUDO
# SUDO_PASS
# SUDO_USER
# ALLOW_EXEC
# ALLOW_OVERRIDE_CONFIG

## Copy SSH key
mkdir -p ~/.ssh/
echo $SSH_KEY > ~/.ssh/id_rsa
chmod go-r ~/.ssh/id_rsa

## Start server
node server.js

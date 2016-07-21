# Grpc Service for Filesystem Access

## Environment Variables
* `SSH_HOST` Optionally define the host the commands should be executed on
* `SSH_PORT` The port the remote machines listens on
* `SSH_USER` The remote user to be logged in as
* `SSH_KEY` The private key to access the remote machine
* `SUDO` Boolean to determine if sudo should be used to execute commands
* `SUDO_PASS` The password used for sudo access
* `SUDO_USER` The user to change to
* `ALLOW_EXEC` Allow execution of custom commands

## How to use

You can either manually build the docker container and run it, or use the provided docker compose file, which currently includes a hubot slack adapter.

The docker-compose file expects environment variables to be present in a subdirectory `env`.

Hubot only needs `HUBOT_SLACK_TOKEN` to be defined (in addition to what is present in the docker-compose file)

Please refer to the official [hubot-grpc repository](https://github.com/hubot-grpc/hubot-grpc) for additional information.

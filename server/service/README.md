# Server Service

## Setup

Install [nvm](https://github.com/nvm-sh/nvm) and install a version of Node.js (currently using v12.11.1).

```bash
$ nvm install v12.11.1
```

Copy the systemd service definition to the systemd folder.

```bash
$ sudo cp server/super8.service /lib/systemd/system/super8.service
$ sudo chmod 644 /lib/systemd/system/super8.service
```

Tell systemd about the new service.

```bash
$ sudo systemctl daemon-reload
```

## Controlling the service

```bash
$ sudo systemctl status super8
$ sudo systemctl restart super8
$ sudo systemctl stop super8
$ sudo systemctl start super8
```

The `restart.sh`, `stop.sh`, and `start.sh` bash files can be run as shortcuts.

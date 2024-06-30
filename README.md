# Kafka Examples Application

This repository contains a fully packed demo application with Kafka producer and consumer. Producers is implemented as SvelteKit web UI application and consumer is a trivial Golang service.

> Disclaimer: this repos is only for demonstration purposes and is intended to be a trivial local sandbox, not a production-ready solution in any kind.

Services:

- kafka-test-app-ui - a SvelteKit web UI, where user can send a message to Kafka topic called `UI_Messages` with arbitrary text.
- kafka-test-words-counter - a Golang service that consumes messages from `UI_Messages` Kafka topic, count words in it and save text and words count into PostgreSQL table `user_text`.

Infrastructure:

- 3 nodes of Kafka brokers connected in single Kafka cluster.
- kafka-ui for managing cluster.
- PostgreSQL server
- pg-admin for managing PostreSQL.


## Web UI features

- Sending Kafka message to automatically choses partition or for specific one.
- Broadcasting Kafka message to multiple partitions.
- Adding header(s) to produced Kafka message.
- Setting message key. If nothing is provided, then key will be a UUID v4 string.


## Consumer features

- Deduplication: while saving record to database, message key is used as a primary keys for record.

## How to use

1. Install docker and docker-compose on your machine. Easiest way for all OS is to install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Clone/download this repo and open its root directory in terminal.
3. Run `docker-compose -f docker-compose.full.yml up -d --build` to start services with all infrastructure.
4. Validate that all containers started. Exception is `kafka-create-topics` container, it only creates a `UI_Messages` topic and will exit after job is done. Running it one more time after docker compose was up is a plus.
5. Use Web UIs:
    - `kafka-test-app-ui` is available from `localhost:3000`.
    - `kafka-ui` is available from `localhost:8080`.
    - `pg-admin` is available from `localhost:5050`.
        - login and password for UI are `admin@admin.com` и `root` respectively.
        - login and password for database are `foo` and `bar` respectively. Server in `pg-admin` is already registered, you just need type a password.
6. When you finish playing, you can stop and remove all running containers via `docker-compose -f docker-compose.full.yml down --rmi=all --volumes`.

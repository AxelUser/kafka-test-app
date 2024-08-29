import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
	clientId: env.KAFKA_CLIENT_ID,
	brokers: env.KAFKA_BROKERS?.split(',') ?? []
});

export const producer = kafka.producer({
	idempotent: true,
	retry: {
		retries: 10
	}
});

export const admin = kafka.admin();

export function connect() {
	return Promise.all([
		producer.connect(),
		admin.connect()
	]);
}
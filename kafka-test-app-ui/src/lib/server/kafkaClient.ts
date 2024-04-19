import { env } from "$env/dynamic/private";
import { Kafka } from "kafkajs";

export function getKafkaClient(): Kafka {
	return new Kafka({
		clientId: env.KAFKA_CLIENT_ID,
		brokers: env.KAFKA_BROKERS.split(',')
	});
}

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { type Message } from 'kafkajs';
import type { KafkaMessageRequest, KafkaMessageResponse } from '$lib/types';
import { env } from '$env/dynamic/private';
import { getKafkaClient } from '$lib/server/kafkaClient';

export const POST: RequestHandler = async ({ request }) => {
	const producer = getKafkaClient().producer()
	try {
		await producer.connect();
		const data: KafkaMessageRequest = await request.json();

		// Validate the data before sending to Kafka
		if (!data.message.trim() || data.headers.some((h) => !h.key.trim())) {
			await producer.disconnect();
			return json({ error: 'Message or headers are invalid.' }, { status: 400 });
		}

		await producer.send({
			topic: env.KAFKA_TOPIC,
			messages: getMessages(data),
			acks: 1
		});

		await producer.disconnect();
		return json({ message: 'Message sent successfully.' } as KafkaMessageResponse);
	} catch (error) {
		console.error('Error sending message to Kafka:', error);
		return json({ error: 'Failed to send message.' } as KafkaMessageResponse, { status: 500 });
	}
};

function getMessages(req: KafkaMessageRequest): Message[] {
	if (req.selectedPartitions && req.selectedPartitions.length > 0) {
		return req.selectedPartitions.map((pId) => ({
			partition: pId,
			key: req.messageKey,
			value: req.message,
			headers: req.headers.map((h) => ({ key: h.key, value: h.value }))
		}));
	} else {
		return [
			{
				key: req.messageKey,
				value: req.message,
				headers: req.headers.map((h) => ({ key: h.key, value: h.value }))
			}
		];
	}
}

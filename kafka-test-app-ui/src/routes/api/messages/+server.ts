import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { type Message } from 'kafkajs';
import type { KafkaMessageRequest, KafkaMessageResponse } from '$lib/types';
import { env } from '$env/dynamic/private';
import { getKafkaClient } from '$lib/server/kafkaClient';
import type { UserTextMessage } from '$lib/server';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request }) => {
	const producer = getKafkaClient().producer();
	try {
		await producer.connect();
		const data: KafkaMessageRequest = await request.json();

		// Validate the data before sending to Kafka
		if (!data.message.trim() || data.headers.some((h) => !h.key.trim())) {
			await producer.disconnect();
			return json({ error: 'Message or headers are invalid.' }, { status: 400 });
		}

		await producer.send({
			topic: env.USER_TEXT_MESSAGES_TOPIC,
			messages: getMessages(data),
			acks: 1
		});

		await producer.disconnect();
		return json({ message: 'Message sent successfully.' } as KafkaMessageResponse);
	} catch (error) {
		console.error(`Error sending message to Kafka topic ${env.USER_TEXT_MESSAGES_TOPIC}:`, error);
		return json({ error: 'Failed to send message.' } as KafkaMessageResponse, { status: 500 });
	}
};

function getMessages(req: KafkaMessageRequest): Message[] {
	const messageKey = req.messageKey.trim() || uuidv4();

	const value = JSON.stringify({
			userText: req.message
		} as UserTextMessage
	);

	const headers = Object.fromEntries(req.headers.map((h) => [ h.key + "", h.value + ""]));

	if (req.selectedPartitions && req.selectedPartitions.length > 0) {
		return req.selectedPartitions.map((pId) => ({
			partition: pId,
			key: messageKey,
			value: value,
			headers: headers
		}));
	} else {
		return [
			{
				key: messageKey,
				value: value,
				headers: headers
			} as Message
		];
	}
}

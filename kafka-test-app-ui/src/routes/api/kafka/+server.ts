// src/routes/api/partitions/[topic].js
import { getKafkaClient } from '$lib/server/kafkaClient';
import { env } from '$env/dynamic/private';
import type { TopicInfo } from '$lib/types';

export async function GET() {
	const admin = getKafkaClient().admin();
	await admin.connect();

	try {
		// Fetch metadata for the specific topic
		const metadata = await admin.fetchTopicMetadata({ topics: [env.USER_TEXT_MESSAGES_TOPIC] });
		const partitions = metadata.topics[0].partitions
			.map((partition) => +partition.partitionId)
			.toSorted((a, b) => a - b);

		await admin.disconnect();

		return new Response(JSON.stringify({ partitions } as TopicInfo), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 200
		});
	} catch (error) {
		await admin.disconnect();

		return new Response(JSON.stringify({ error }), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 500
		});
	}
}

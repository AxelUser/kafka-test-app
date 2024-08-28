// src/routes/api/partitions/[topic].js
import { admin } from '$lib/kafka';
import { env } from '$env/dynamic/private';
import type { TopicInfo } from '$lib/types';

export async function GET() {

	try {
		await admin.connect();
	} catch (error) {
		console.error('Error connecting to Kafka:', error);
		return new Response(JSON.stringify({ error: 'Failed to connect to Kafka.' }), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 500
		});
	}

	try {
		// Fetch metadata for the specific topic
		const metadata = await admin.fetchTopicMetadata({ topics: [env.USER_TEXT_MESSAGES_TOPIC] });
		const partitions = metadata.topics[0].partitions
			.map((partition) => +partition.partitionId);
		
		partitions.sort((a, b) => a - b);

		return new Response(JSON.stringify({ partitions } as TopicInfo), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 200
		});
	} catch (error) {

		return new Response(JSON.stringify({ error }), {
			headers: {
				'Content-Type': 'application/json'
			},
			status: 500
		});
	}
}

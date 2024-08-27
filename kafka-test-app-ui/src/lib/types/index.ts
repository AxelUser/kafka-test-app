export interface Header {
	key: string;
	value: string;
}

export interface KafkaMessageRequest {
	messageKey?: string;
	message: string;
	headers: Header[];
	selectedPartitions: number[];
}

export interface KafkaMessageResponse {
	message: string;
	error?: string;
}

export type Partition = number;

export interface TopicInfo {
	partitions: Partition[]
}

<script lang="ts">
	import { writable } from 'svelte/store';
	import type { KafkaMessageRequest, KafkaMessageResponse, Partition, TopicInfo } from '$lib/types';

	type Header = { key: string; value: string };

	let isSending = false;
	let messageStatus = '';

	let partitions: Partition[] = [];
	let partitionType: 'ANY' | 'SPECIFIC' = 'ANY';
	let selectedPartitions: Partition[] = [];
	let messageKey: string = '';
	let message: string = '';
	let headers: Header[] = [{ key: '', value: '' }];
	let errorMessage = writable('');

	// Reactively clear selected partitions when partition type changes to "ANY"
	$: if (partitionType === 'ANY') {
		selectedPartitions = [];
	} else {
		updateTopicInfo();
	}

	function addHeader(): void {
		headers = [...headers, { key: '', value: '' }];
	}

	function removeHeader(index: number): void {
		headers = headers.filter((_, i) => i !== index);
	}

	function selectAll(): void {
		selectedPartitions = partitions;
	}

	function unselectAll(): void {
		selectedPartitions = [];
	}

	function sendMessage(): void {
		if (!message.trim()) {
			errorMessage.set('Message cannot be empty.');
			return;
		}
		if (headers.some((h) => !h.key.trim())) {
			errorMessage.set('Header key cannot be empty.');
			return;
		}
		errorMessage.set('');
		postMessage({ messageKey, message, headers, selectedPartitions });
	}

	async function postMessage(messageRequest: KafkaMessageRequest): Promise<void> {
		isSending = true;
		messageStatus = 'Sending...';
		const response = await fetch('/api/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(messageRequest)
		});
		const data: KafkaMessageResponse = await response.json();
		isSending = false;

		if (!response.ok) {
			messageStatus = data.error || 'Failed to send message.';
		} else {
			messageStatus = data.message;
		}
	}

	async function updateTopicInfo() {
		const response = await fetch(`/api/kafka`);
		if (!response.ok) {
			console.error('Failed to fetch partitions');
			return;
		}

		const topicInfo: TopicInfo = await response.json();
		partitions = topicInfo.partitions;
	}
</script>

<div class="max-w-lg mx-auto p-4">
	<div class="mb-4">
		<label for="messageKey" class="block text-sm font-medium text-gray-700">Message Key</label>
		<input
			type="text"
			id="messageKey"
			class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			bind:value={messageKey}
		/>
	</div>
	<div class="mb-4">
		<label for="message" class="block text-sm font-medium text-gray-700">Message</label>
		<textarea
			id="message"
			class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			bind:value={message}
		></textarea>
	</div>
	<!-- Add headers dynamically and validation for headers -->
	{#each headers as header, index}
		<div class="mb-4 flex gap-2">
			<input
				type="text"
				placeholder="Header Key"
				class="flex-grow mt-1 p-2 border border-gray-300 rounded-l-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				bind:value={header.key}
			/>
			<input
				type="text"
				placeholder="Header Value"
				class="flex-grow mt-1 p-2 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				bind:value={header.value}
			/>
			<button
				class="p-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
				on:click={() => removeHeader(index)}>X</button
			>
		</div>
	{/each}
	<!-- Buttons for adding and managing headers -->
	<button
		class="mb-4 p-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
		on:click={addHeader}>Add Header</button
	>
	<div class="mb-4">
		<label class="block text-sm font-medium text-gray-700">Partition</label>
		<select
			class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
			bind:value={partitionType}
		>
			<option value="ANY">Any</option>
			<option value="SPECIFIC">Specific</option>
		</select>
	</div>
	{#if partitionType === 'SPECIFIC'}
		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700">Select Partitions</label>
			{#each partitions as partition}
				<label class="inline-flex items-center mt-3">
					<input
						type="checkbox"
						class="form-checkbox h-5 w-5 text-gray-600"
						value={partition}
						bind:group={selectedPartitions}
					/>
					<span class="ml-2 text-gray-700">{partition}</span>
				</label>
			{/each}
			<div class="flex gap-4 mt-4">
				<button
					class="p-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
					on:click={selectAll}>Select All</button
				>
				<button
					class="p-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
					on:click={unselectAll}>Unselect All</button
				>
			</div>
		</div>
	{/if}

	<button
		class="mt-4 p-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:hover:bg-gray-400"
		disabled={isSending}
		on:click={sendMessage}
	>
		Send Message
	</button>
	{#if $errorMessage}
		<p class="text-red-500 text-xs italic mt-2">{$errorMessage}</p>
	{/if}

	{#if messageStatus}
		<p class="text-sm mt-2">{messageStatus}</p>
	{/if}
</div>

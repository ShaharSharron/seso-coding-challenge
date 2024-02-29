'use strict';

const MinHeap = require('../lib/min-heap');

const SOURCE_ITEMS_LIMIT_TO_PULL = 20;
// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
	const minHeap = new MinHeap();
	const logSourcesWithIds = logSources.map((logSource, i) => ({
		source: logSource,
		index: i,
	}));

	// Init semaphore to ensure:
	// 1. we only pop once from each source until the promise resolved,
	// 2. and no more than SOURCE_ITEMS_LIMIT_TO_PULL to ensure we don't run into space issues
	const sourcesPopSemaphoreMap = {};
	logSourcesWithIds.forEach((logSource) => {
		sourcesPopSemaphoreMap[logSource.index] = {
			promise: null,
			cnt: 0,
			drained: false,
		};
	});

	const addNextBatchToHeap = () => {
		return logSourcesWithIds.map(async (logSource) => {
			// If we have from the source more than SOURCE_ITEMS_LIMIT_TO_PULL,
			if (
				sourcesPopSemaphoreMap[logSource.index].cnt >
					SOURCE_ITEMS_LIMIT_TO_PULL ||
				sourcesPopSemaphoreMap[logSource.index].drained ||
				sourcesPopSemaphoreMap[logSource.index].promise !== null
			) {
				return Promise.resolve();
			}

			// Save the promise so we won't pop again from the same source
			const promise = logSource.source.popAsync();
			sourcesPopSemaphoreMap[logSource.index].promise = promise;
			let item = await promise;
			// Once promise resolved, we can free the semaphore lock
			sourcesPopSemaphoreMap[logSource.index].promise = null;

			// If we have an item, insert the new item to the heap
			if (item) {
				minHeap.insert({
					value: item.date,
					item,
					source: logSource,
				});

				sourcesPopSemaphoreMap[logSource.index].cnt++;
			}
			// Else, mark the source as drained
			else {
				sourcesPopSemaphoreMap[logSource.index].drained = true;
			}
		});
	};

	return new Promise((resolve, reject) => {
		// Init the first batch of items, one from each source
		let firstBatchPromises = addNextBatchToHeap();

		// We need to have at least one item from each source, so wait for initial batch
		Promise.all(firstBatchPromises).then(async () => {
			while (!minHeap.isEmpty()) {
				const nextMinItem = minHeap.extractMin();
				printer.print(nextMinItem.item);

				sourcesPopSemaphoreMap[nextMinItem.source.index].cnt--;

				const nextBatchPromises = addNextBatchToHeap();
				// If the heap is empty, make sure we wait for the next batch
				if (minHeap.isEmpty()) {
					await Promise.all(nextBatchPromises);
				}

				// If this was the last item from the source, wait for the new item
				// to arrive from this source to ensure the heap will have the minimum
				// from all sources
				if (sourcesPopSemaphoreMap[nextMinItem.source.index].cnt <= 0) {
					await sourcesPopSemaphoreMap[nextMinItem.source.index]
						.promise;
				}
			}

			printer.done();
			resolve(console.log('Async sort complete.'));
		});
	});
};

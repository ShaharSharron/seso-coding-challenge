'use strict';

const MinHeap = require('../lib/min-heap');

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
	const minHeap = new MinHeap();
	const logSourcesWithIds = logSources.map((logSource, i) => ({
		source: logSource,
		index: i,
	}));
	const heapItemsCounterMap = {};

	const addNextBatchToHeap = () => {
		return logSourcesWithIds.map(async (logSource) => {
			if (
				heapItemsCounterMap[logSource.index] > 20 ||
				heapItemsCounterMap[logSource.index] === null
			) {
				return Promise.resolve();
			}

			let item = await logSource.source.popAsync();
			if (item) {
				minHeap.insert({
					value: item.date,
					item,
					source: logSource,
				});

				heapItemsCounterMap[logSource.index] = isNaN(
					heapItemsCounterMap[logSource.index]
				)
					? 1
					: heapItemsCounterMap[logSource.index] + 1;
			} else {
				heapItemsCounterMap[logSource.index] = null;
			}
		});
	};

	return new Promise((resolve, reject) => {
		// Initialize the heap with all items as pop items may be slow and initializing the heap
		// help us to parallelize this expensive operation
		let firstBatchPromises = [];
		for (let i = 0; i < 20; i) {
			firstBatchPromises.push(...addNextBatchToHeap());
		}

		Promise.all(firstBatchPromises).then(async () => {
			while (!minHeap.isEmpty()) {
				const nextMinItem = minHeap.extractMin();
				printer.print(nextMinItem.item);

				heapItemsCounterMap[nextMinItem.source.index]--;

				if (heapItemsCounterMap[nextMinItem.source.index] <= 10) {
					const nextBatchPromises = addNextBatchToHeap();

					if (heapItemsCounterMap[nextMinItem.source.index] <= 0) {
						await Promise.all(nextBatchPromises);
					}
				}
			}

			printer.done();
			resolve(console.log('Async sort complete.'));
		});
	});
};

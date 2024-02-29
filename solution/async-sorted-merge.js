'use strict';

const MinHeap = require('../lib/min-heap');

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = (logSources, printer) => {
	const minHeap = new MinHeap();

	return new Promise((resolve, reject) => {
		// Initialize the heap with all items as pop items may be slow and initializing the heap
		// help us to parallelize this expensive operation
		const fullListInsertedToHeapPromise = logSources.map((logSource) => {
			return new Promise(async (resolve, reject) => {
				let item = await logSource.popAsync();
				while (item) {
					minHeap.insert({ item, source: logSource });
					item = await logSource.popAsync();
				}
				resolve();
			});
		});

		Promise.all(fullListInsertedToHeapPromise).then(() => {
			while (!minHeap.isEmpty()) {
				printer.print(minHeap.extractMin().item);
			}

			printer.done();
			resolve(console.log('Async sort complete.'));
		});
	});
};

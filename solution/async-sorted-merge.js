'use strict';

const MinHeap = require('../lib/min-heap');

// Print all entries, across all of the *async* sources, in chronological order.

const handleItemsInHeap = (minHeap, printer) => {
	if (minHeap.isEmpty()) {
		return Promise.resolve();
	}

	const minLogEntryDataItem = minHeap.extractMin();
	printer.print(minLogEntryDataItem.item);

	return minLogEntryDataItem.source
		.popAsync()
		.then((nextItemInSource) => {
			if (nextItemInSource) {
				minHeap.insert({
					item: nextItemInSource,
					source: minLogEntryDataItem.source,
				});
			}
		})
		.then(() => {
			handleItemsInHeap(minHeap, printer);
		});
};

module.exports = (logSources, printer) => {
	return new Promise((resolve, reject) => {
		const minHeap = new MinHeap();

		// Initialize the heap with the first item from each logSource
		const initialPromises = logSources.map((logSource) => {
			return logSource
				.popAsync()
				.then(
					(item) =>
						item && minHeap.insert({ item, source: logSource })
				);
		});

		Promise.all(initialPromises).then(() => {
			handleItemsInHeap(minHeap, printer);
			printer.done();
			resolve(console.log('Async sort complete.'));
		});
	});
};

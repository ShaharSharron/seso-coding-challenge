'use strict';

const MinHeap = require('../lib/min-heap');

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
	const minHeap = new MinHeap();

	// Initialize the heap with the first item from each logSource
	logSources.forEach((logSource) => {
		const item = logSource.pop();
		if (item) {
			minHeap.insert({ item, source: logSource });
		}
	});

	// Continue until the min heap is empty
	while (!minHeap.isEmpty()) {
		const minLogEntryDataItem = minHeap.extractMin();
		printer.print(minLogEntryDataItem.item);

		const nextItemInSource = minLogEntryDataItem.source.pop();
		if (nextItemInSource) {
			minHeap.insert({
				item: nextItemInSource,
				source: minLogEntryDataItem.source,
			});
		}
	}

	printer.done();
	return console.log('Sync sort complete.');
};

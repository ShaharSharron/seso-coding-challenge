/*
    I also don't like OOP - but min heap is something that makes sense to create as class
*/

module.exports = class MinHeap {
	constructor() {
		this.heap = [];
	}

	getParentIndex(index) {
		return Math.floor((index - 1) / 2);
	}

	getLeftChildIndex(index) {
		return index * 2 + 1;
	}

	getRightChildIndex(index) {
		return index * 2 + 2;
	}

	swap(index1, index2) {
		const temp = this.heap[index1];
		this.heap[index1] = this.heap[index2];
		this.heap[index2] = temp;
	}

	heapifyUp(index) {
		let currentIndex = index;
		let parentIndex = this.getParentIndex(currentIndex);
		while (
			parentIndex >= 0 &&
			this.heap[currentIndex].value < this.heap[parentIndex].value
		) {
			this.swap(currentIndex, parentIndex);
			currentIndex = parentIndex;
			parentIndex = this.getParentIndex(currentIndex);
		}
	}

	heapifyDown(index) {
		let currentIndex = index;
		let leftChildIndex = this.getLeftChildIndex(currentIndex);
		let rightChildIndex = this.getRightChildIndex(currentIndex);
		let smallestIndex = currentIndex;

		if (
			leftChildIndex < this.heap.length &&
			this.heap[leftChildIndex].value < this.heap[currentIndex].value
		) {
			smallestIndex = leftChildIndex;
		}

		if (
			rightChildIndex < this.heap.length &&
			this.heap[rightChildIndex].value < this.heap[smallestIndex].value
		) {
			smallestIndex = rightChildIndex;
		}

		if (smallestIndex !== currentIndex) {
			this.swap(currentIndex, smallestIndex);
			this.heapifyDown(smallestIndex);
		}
	}

	insert(value) {
		this.heap.push(value);
		this.heapifyUp(this.heap.length - 1);
	}

	extractMin() {
		if (this.heap.length === 0) {
			return null;
		}

		if (this.heap.length === 1) {
			return this.heap.pop();
		}

		const min = this.heap[0];
		this.heap[0] = this.heap.pop();
		this.heapifyDown(0);
		return min;
	}

	peek() {
		return this.heap.length === 0 ? null : this.heap[0];
	}

	isEmpty() {
		return this.heap.length === 0;
	}

	size() {
		return this.heap.length;
	}
};

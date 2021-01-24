/**
 * Swap the values of the given array of the given index
 * @param {any[]} arr
 * @param {number} i1
 * @param {number} i2
 */
function swap(arr, i1, i2) {
  let temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

/**
 * Auxiliary functions for head implementation.
 */
let left = (i) => i << 1;
let right = (i) => (i << 1) + 1;
let par = (i) => i >> 1;

/**
 * Minimal Heap
 */
class MinHeap {
  /**
   * Default comparator of MinHeap
   *
   * compare two element with operator <
   * @param {any} a
   * @param {any} b
   */
  static defaultLessThan(a, b) {
    return a < b;
  }

  #data = [undefined];
  #cmp = MinHeap.defaultLessThan;

  /**
   * Construct a minimal heap with the given comparator
   * @param {function(a, b):boolean} lessThan the given comparator. If a < b, then should lessThan(a, b) return true.
   */
  constructor(lessThan = MinHeap.defaultLessThan) {
    this.#data = [undefined];
    this.#cmp = lessThan;
  }

  /**
   * Get the minimal element in the heap.
   * @returns the minimal element
   */
  top() {
    this.#checkTopElement();
    return this.#data[1];
  }

  /**
   * Pop the minimal element from the heap.
   * @returns the popped element
   */
  pop() {
    this.#checkTopElement();
    let data = this.#data;
    let cmp = this.#cmp;

    swap(data, 1, data.length - 1);
    let ret = data.pop();

    let i = 1;
    while (i < data.length) {
      let l = left(i),
        r = right(i);
      let minI = i;
      if (l < data.length && cmp(data[l], data[minI])) minI = l;
      if (r < data.length && cmp(data[r], data[minI])) minI = r;
      if (minI == i) break;
      swap(data, i, minI);
      i = minI;
    }

    return ret;
  }

  /**
   * Add a new element into the heap
   * @param {any} val the new element
   */
  push(val) {
    let data = this.#data;
    let cmp = this.#cmp;

    let i = data.push(val) - 1;
    while (i > 1) {
      let parent = par(i);
      if (cmp(data[i], data[parent])) {
        swap(data, i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Get the size of the heap
   * @returns {number} the size of the heap
   */
  size() {
    return this.#data.length - 1;
  }

  /**
   * Check whether the heap is empty (which means this.size() == 0)
   * @return {boolean} true if the heap is empty, otherwise, return false
   */
  empty() {
    return this.size() == 0;
  }

  /**
   * Assert that the heap has top element. Otherwise, throw a exception.
   */
  #checkTopElement() {
    if (this.empty()) {
      throw new ReferenceError("Try to refer the top element of empty heap.");
    }
  }
}

function testMinHeap() {
  let heap = new MaxHeap();
  let data = [5, 3, 9, 7, 4, 14, 3, 2];

  data.forEach((num) => {
    heap.push(num);
  });

  let sorted = [];
  while (!heap.empty()) {
    let num = heap.pop();
    sorted.push(num);
  }

  console.debug(sorted);
}

export { MinHeap, testMinHeap };

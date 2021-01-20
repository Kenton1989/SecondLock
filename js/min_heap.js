let left = (i) => i << 1;
let right = (i) => (i << 1) + 1;
let par = (i) => i >> 1;
function swap(arr, i1, i2) {
  let temp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = temp;
}

class MinHeap {
  static defaultLessThan(a, b) {
    return a < b;
  }

  #data = [undefined];
  #cmp = MinHeap.defaultLessThan;

  constructor(lessThan = MinHeap.defaultLessThan) {
    this.#data = [undefined];
    this.#cmp = lessThan;
  }

  top() {
    this.#checkNonEmpty();
    return this.#data[1];
  }

  pop() {
    this.#checkNonEmpty();
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

  size() {
    return this.#data.length - 1;
  }

  empty() {
    return this.size() == 0;
  }

  #checkNonEmpty() {
    if (this.empty()) {
      throw new ReferenceError("Try to refer the top element of empty heap.");
    }
  }
}

class MaxHeap extends MinHeap {
  static defaultLessThan = MinHeap.defaultLessThan;

  constructor(lessThan = MaxHeap.defaultLessThan) {
    super((a, b) => !lessThan(a, b));
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

  console.log(sorted);
}

export { MinHeap, MaxHeap, testMinHeap };

import { lessThan } from "./util";

// Basic Knowledge: merge sort
// - merge of merge sort always merge naighbour chunks
// - timsort is improved merge sort for the two aspects: split and merge
//   - split: change to looply splitting monotonic sequences
//   - merge: make more efficient

// merge sort: naive recursive implementation
export function mergeSort(array: number[], first: number, last: number) {
  if (last - first <= 1) return array;
  // - max stack size is: smax = 0; while (len > 0) {smax++;len>>1;}
  // - make stack as maxsize array of chunk struct. not pointer of the struct
  const stack = [];
  let remain = first;
  while (remain < last) {
    // cut 1 element chunk
    stack.push({
      first: remain,
      last: remain + 1,
      length: 1,
    });
    remain++;

    // merge conditions:
    // - last two chunk become same size
    // - no more chunk remained on array
    while (
      stack.length > 1 &&
      (remain >= last ||
        stack[stack.length - 2].length < stack[stack.length - 1].length * 2)
    ) {
      const pre = stack[stack.length - 2];
      const cur = stack.pop();
      // assert pre.last === cur.first

      // merge two chunks
      mergeNeighbor(array, pre.first, pre.last, cur!.last);
      // add two chunks as single chunk
      pre.last = cur!.last;
      pre.length += cur!.length;
    }
  }
  return array;
}

// merge of merge sort with addtional buffers
// - merge [first, connect) and [connect, last)
function mergeNeighbor(
  array: number[],
  first: number,
  connect: number,
  last: number
) {
  // escape both buffers
  const left = array.slice(first, connect);
  let lcur = 0,
    llast = connect - first;
  const right = array.slice(connect, last);
  let rcur = 0,
    rlast = last - connect;

  let cur = first;
  while (lcur < llast && rcur < rlast) {
    // copy back every lower side
    const lval = left[lcur];
    const rval = right[rcur];
    if (!lessThan(rval, lval)) {
      // (lval <= rval) for sort stable
      array[cur++] = lval;
      lcur++;
    } else {
      array[cur++] = rval;
      rcur++;
    }
  }

  // copy back to remained side (one of the two loops is always empty)
  // C: memcpy(left+lcur, array+cur, llast-lcur)
  while (lcur < llast) array[cur++] = left[lcur++];
  while (rcur < rlast) array[cur++] = right[rcur++];
  return array;
}

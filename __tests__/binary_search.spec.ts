import { binarySearch } from "../src/binary_search"; 

test('test binary search', () => {
  const arr = [1, 2, 3, 4, 6, 20, 30];
  const res = binarySearch(arr, 0, arr.length - 1, 6);
  expect(res).toBe(4);
})

import { binarySort } from "../src/binary_sort";

test('test_binary_sort', () => {
  const arr = [2, 5, 30, 6,12, 1, 3, 6, 4, 20];
  const res = binarySort(arr, 0, arr.length - 1, 2);
  expect(res.toString()).toBe('1,2,3,4,5,6,6,12,20,30');
})

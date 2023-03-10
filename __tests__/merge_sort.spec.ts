import { mergeSort } from "../src/merge_sort";

test('test_merge_sort', () => {
  const arr = [2, 5, 30, 6,12, 1, 3, 6, 4, 20];
  const res = mergeSort(arr, 0, arr.length);
  expect(res.toString()).toBe('1,2,3,4,5,6,6,12,20,30');
})

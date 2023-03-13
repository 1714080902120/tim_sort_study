import { quickSort } from "../src/quick_sort";

test('test_quick_sort', () => {
  const arr = [];
  for (let i = 0; i < 1257; i++) {
    arr.push(Math.floor(Math.random() * 100));
  }

  const copyArr = [...arr].sort((a, b) => (a - b));
  const copyStr = copyArr.join(',');
  const res = quickSort(arr);
  expect(res.toString()).toBe(copyStr);
})

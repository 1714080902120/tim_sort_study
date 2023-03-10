import { equalTo, lessThan } from "./util";

// 二分搜索
export function binarySearch(
  array: number[],
  first: number,
  last: number,
  value: number
): number {
  while (first < last) {
    var mid = last + ((first - last) >> 1);
    if (lessThan(value, array[mid])) {
      last = mid;
    } else if (equalTo(value, array[mid])) {
      return mid;
    } else {
      first = mid + 1;
    }
  }
  return first;
}

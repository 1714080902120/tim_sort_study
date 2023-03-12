import { binarySearch } from "./binary_search";

export function binarySort(
  array: number[],
  first: number,
  last: number,
  sortStart: number
): number[] {
  sortStart = sortStart || first;
  for (let i = sortStart; i <= last; i++) {
    cyclicRShift(array, binarySearch(array, first, i, array[i]), i);
  }
  return array;
}

function cyclicRShift(array: number[], first: number, last: number) {
  if (last - first <= 0) return array;
  const mostRight = array[last];
  for (let cur = last; cur > first; cur--) {
    array[cur] = array[cur - 1];
  }
  array[first] = mostRight;
  return array;
}

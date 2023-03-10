import { mergeSort } from "./merge_sort";

export function timsort (array: number[]): number[] {
  if (array.length < 2) return array;
  return mergeSort(array, 0, array.length);
}

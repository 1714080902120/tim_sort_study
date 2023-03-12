import { mergeSort } from "./merge_sort";

export function timsort (array: number[]): number[] {
  if (array.length < 2) return array;
  // 注意这里我们是传入的`array.length`而不是`array.length - 1`，所以后面有些地方需要做初始值处理
  return mergeSort(array, 0, array.length);
}

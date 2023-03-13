export function quickSort(arr: number[]) {
  function _quickSort(arr: number[], start: number, end: number) {
    if (start >= end) return;
    let key = arr[end];
    let left = start,
      right = end - 1;
    while (left < right) {
      while (arr[left] < key && left < right) left++;
      while (arr[right] >= key && left < right) right--;
      [arr[left], arr[right]] = [arr[right], arr[left]];
    }
    if (arr[left] >= arr[end]) {
      [arr[left], arr[end]] = [arr[end], arr[left]];
    } else {
      left++;
    }
    _quickSort(arr, start, left - 1);
    _quickSort(arr, left + 1, end);
  }
  _quickSort(arr, 0, arr.length - 1);
  return arr;
}

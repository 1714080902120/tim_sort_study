export function lessThan(a: number, b: number): boolean {
  return a < b;
}

export function equalTo(a: number, b: number): boolean {
  return a === b;
}

export function lessThanEqual(a: number, b: number): boolean {
  return a <= b;
}

export function reverse(array: number[], first: number, last: number) {
  last--;
  while (first < last) {
    const tmp = array[first];
    array[first] = array[last];
    array[last] = tmp;
    first++;
    last--;
  }
}

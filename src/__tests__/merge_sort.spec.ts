import { timsort } from "../src/timsort";
describe("test_tim_sort", () => {
  test("test_only_one_element", () => {
    const arr = [1];
    const res = timsort(arr);
    expect(res.toString()).toBe("1");
  });

  test("test_two_element", () => {
    const arr = [3, 1];
    const res = timsort(arr);
    expect(res.toString()).toBe("1,3");
  });

  test("test_reverse", () => {
    const arr = [5, 3, 2, 1];
    const res = timsort(arr);
    expect(res.toString()).toBe("1,2,3,5");
  });

  test("test_descendant", () => {
    const arr = [5, 7, 4, 3, 2, 1];
    const res = timsort(arr);
    expect(res.toString()).toBe("1,2,3,4,5,7");
  });

  test("test_random", () => {
    const arr = [];
    for (let i = 0; i < 257; i++) {
      arr.push(Math.random() * 100);
    }

    const copyArrStr = [...arr].sort((a, b) => a - b).join(",");
    const res = timsort(arr);
    expect(res.toString()).toBe(copyArrStr);
  });

  test("test_merge_sort", () => {
    const arr = [2, 5, 30, 6, 12, 1, 3, 6, 4, 20];
    const res = timsort(arr);
    expect(res.toString()).toBe("1,2,3,4,5,6,6,12,20,30");
  });
});

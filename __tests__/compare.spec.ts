import { timsort } from "../src/timsort";
import { quickSort } from "../src/quick_sort";

describe("test_compare", () => {
  test("test_compare_with_all_random", () => {
    let num1 = 0;
    let num2 = 0;
    let num3 = 0;
    for (let i = 0; i < 500; i++) {
      const arr = [];
      const arr2 = [];
      const arr3 = [];
      for (let j = 0; j < 20000; j++) {
        const ran_num = Math.random() * 200;
        arr.push(ran_num);
        arr2.push(ran_num);
        arr3.push(ran_num);
      }

      const q_date_begin = new Date().getTime();
      quickSort(arr);
      const q_date_end = new Date().getTime();
      const final_q_time = q_date_end - q_date_begin;
      num1 += final_q_time;
      const t_date_begin = new Date().getTime();
      timsort(arr2);
      const t_date_end = new Date().getTime();
      const final_t_time = t_date_end - t_date_begin;
      num2 += final_t_time;

      // 原生sort
      const ot_date_begin = new Date().getTime();
      arr3.sort((a, b) => a - b)
      const ot_date_end = new Date().getTime();
      const final_ot_time = ot_date_end - ot_date_begin;
      num3 += final_ot_time;
    }
    // 从左到右依次是快排，我们实现的timsort, sort方法
    console.log(num1, num2, num3);
    expect(num1 < num2).toBe(true);
  });

  test("test_compare_with_none_random", () => {
    let num1 = 0;
    let num2 = 0;
    for (let i = 0; i < 500; i++) {
      const arr = [];
      const arr2 = [];
      for (let j = 0; j < 2000; j++) {
        const ran_num = Math.random() * 200;
        arr.push(ran_num);
        arr2.push(ran_num);
      }

      arr.sort((a, b) => a - b);
      arr2.sort((a, b) => a - b);

      const q_date_begin = new Date().getTime();
      quickSort(arr);
      const q_date_end = new Date().getTime();
      const final_q_time = q_date_end - q_date_begin;
      num1 += final_q_time;
      const t_date_begin = new Date().getTime();
      timsort(arr2);
      const t_date_end = new Date().getTime();
      const final_t_time = t_date_end - t_date_begin;
      num2 += final_t_time;
    }
    // 从左到右依次是快排，我们实现的timsort, sort方法
    console.log(num1, num2);
    expect(num1 < num2).toBe(true);
  });

  test("test_compare_with_part_random", () => {
    let num1 = 0;
    let num2 = 0;
    let num3 = 0;
    const { floor, random } = Math;
    for (let i = 0; i < 500; i++) {
      let arr = [];
      let arr2 = [];
      let arr3 = [];
      for (let j = 0; j < 2000; j++) {
        const ran_num = floor(random() * 20000);
        arr.push(ran_num);
        arr2.push(ran_num);
        arr3.push(ran_num);
      }

      const sortBeginIndex = getRandomIndexArr();

      for (let i = 0; i < sortBeginIndex.length; i++) {
        const begin = sortBeginIndex[i];
        const randomSortNum = 120 + floor(random() * 80);

        arr = sortAndConcatArr(arr, begin, randomSortNum);
        arr2 = sortAndConcatArr(arr2, begin, randomSortNum);
        arr3 = sortAndConcatArr(arr3, begin, randomSortNum);
      }

      const q_date_begin = new Date().getTime();
      quickSort(arr);
      const q_date_end = new Date().getTime();
      const final_q_time = q_date_end - q_date_begin;
      num1 += final_q_time;
      const t_date_begin = new Date().getTime();
      timsort(arr2);
      const t_date_end = new Date().getTime();
      const final_t_time = t_date_end - t_date_begin;
      num2 += final_t_time;

      // 原生sort
      const ot_date_begin = new Date().getTime();
      arr3.sort((a, b) => a - b)
      const ot_date_end = new Date().getTime();
      const final_ot_time = ot_date_end - ot_date_begin;
      num3 += final_ot_time;
    }
    // 从左到右依次是快排，我们实现的timsort, sort方法
    console.log(num1, num2, num3);
    expect(num1 < num2).toBe(true);

    function sortAndConcatArr(arr: number[], index: number, randomSortNum: number) {
      const left = arr.slice(0, index);
      const middle = arr.slice(index, index + randomSortNum);
      const right = arr.slice(index + randomSortNum);
      middle.sort((a, b) => a - b);
      return [...left, ...middle, ...right];
    }

    function getRandomIndexArr (): number[] {
      const arr = []

      const randomNum = 9;
      let lastRandomNum = 0;
      for (let i = 0; i < randomNum; i++) {
        const r = lastRandomNum + 200;
        lastRandomNum = r;
        arr.push(r);
      }

      return arr;
    }
  });
});

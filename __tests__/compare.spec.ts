import { timsort } from "../src/timsort";
import { quickSort } from "../src/quick_sort";

test('test_compare', () => {
  const result = [];
  for (let i = 0; i < 500; i++) {
    
    const arr = [];
    for (let j = 0; j < 20000; j++) {
      arr.push(Math.random() * 200);
    }

    const q_date_begin = (new Date()).getTime();
    quickSort(arr);
    const q_date_end = (new Date()).getTime();
    const final_q_time = q_date_end - q_date_begin;

    const t_date_begin = (new Date()).getTime();
    timsort(arr);
    const t_date_end = (new Date()).getTime();
    const final_t_time = t_date_end - t_date_begin;
    // 相等也不行
    result.push(!!(final_t_time < final_q_time));
  }
  console.log(result.filter(item => item === true).length);
  expect(result.filter(item => item).length > 250).toBe(true);

})

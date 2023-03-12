import { MergeState, Run, MergeItem } from "./../types/timsort.d";
import { binarySearch } from "./binary_search";
import { binarySort } from "./binary_sort";
import { equalTo, lessThan, lessThanEqual, reverse } from "./util";

/**
 * @description timsort核心代码
 */
export function mergeSort(
  array: number[],
  first: number,
  last: number
): number[] {
  const state: MergeState = {
    array,
    runStack: [],
    remain: first,
    last,
    minrun: getMinrun(last - first),
  };

  while (nextRun(state)) {
    while (whenMerge(state)) {
      mergeTwoRuns(state);
    }
  }

  return array;
}

/**
 * @description 获取minrun
 * 范围在[32, 64]当array的长度大于等于64的时候，否则按数组自身大小计算
 */
function getMinrun(n: number): number {
  // 当大于等于64的时候进行右移一位降低到[32, 64]之间。
  // 比如： 1=>1, ..., 63=>63, 64=>32, 65=>33, ..., 127=>64, 128=>32, ...
  let r = 0;
  while (n >= 64) {
    r = r | (n & 1);
    n = n >> 1;
  }
  return n + r;
}

/**
 * @description 用于判断是否还需要截取以及截取run
 */
function nextRun(state: MergeState): boolean {
  const { remain, last: _state_last, array, minrun } = state;
  if (remain >= _state_last) return false;
  // 兼容最后一个元素没得比较的场景
  if (_state_last - remain <= 1) {
    cutRun(state, _state_last);
    return true;
  }

  let last = remain; // run最终长度的索引值，从remain开始
  // 获取此次比对的两个元素，比对仅是为了确认接下来是递增还是递减
  let prev = array[last++];
  const lastVal = array[last++];

  // 判断是递增还是递减
  const isAscendant = lessThanEqual(prev, lastVal);
  prev = lastVal;

  // 找到排序好了的子序列
  while (last < _state_last) {
    const nextItem = array[last];

    // 如果当前元素小于等于下一个元素
    const isLessThanEqual = lessThanEqual(prev, nextItem);

    // 递增过程如果遇到下一个元素小于等于当前元素的时候直接截断
    // 递减过程如果遇到下一个元素大于当前元素的时候直接截断，注意，递减过程不支持等于
    if ((!isLessThanEqual && isAscendant) || (isLessThanEqual && !isAscendant))
      break;

    prev = nextItem;
    last++;
  }
  // 如果是递减，那么需要转一下方向
  if (!isAscendant) {
    reverse(array, remain, last);
  }

  // 如果截取的子序列小于minrun，那么这个时候进行补足
  // 补足方式是通过二分排序
  if (last - remain < minrun) {
    const minrunLength = remain + minrun;
    // 排序的起始位置，[remain, last]之间没必要再跟着排序，前面已经排好了
    const sortStart = last;
    // 如果此时剩余不足minrun，那么截取最后一段即可。
    last = minrunLength > _state_last ? _state_last : minrunLength;

    binarySort(array, remain, last - 1, sortStart);
  }

  // 截取这个排序好了的子序列
  cutRun(state, last);
  return true;
}

/**
 * @description 截取run并存入栈中
 * first表示这个run的起始位置索引
 * last自然就是run的结束位置索引
 * 注意这个run的范围是[first, last)
 * 而下一次截取到的范围则是从这个last的索引作为first/remain开始的范围
 */
function cutRun(state: MergeState, last: number) {
  const { remain, runStack } = state;
  const run: Run = {
    first: remain,
    last,
    length: last - remain,
  };
  runStack.push(run);
  state.remain = last;
}

/**
 * @description 对于任意栈顶的三个run之间保持以下规则
 * 1. |C| > |B| + |A|
 * 2. |B| > |A|
 * 如果不满足，合并较小的两个run
 * 比如：[1] => [1,1] => [2] => [2,1] => [2,1,1] => [2,2] => [4]
 */
function whenMerge(state: MergeState): boolean {
  const { remain, last, runStack } = state;

  // remain === last表示当前已经全部截取完毕，此时如果栈里存在两个及以上的run，返回true表示需要将它们合并
  if (remain === last) return runStack.length > 1;

  if (runStack.length <= 1) return false;

  const length = runStack.length;

  // 栈顶第一个run
  const curRun: Run = runStack[length - 1];
  // 栈顶第二个run
  const preRun: Run = runStack[length - 2];
  // 如果此时栈顶第二个run短于栈顶第一个run，合并处理
  if (length === 2) return preRun.length <= curRun.length;
  // 栈顶第三个run
  const ppreRun: Run = runStack[length - 3];
  return ppreRun.length <= preRun.length + curRun.length;
}

/**
 * @description 根据不同场景合并两个run
 */
function mergeTwoRuns(state: MergeState) {
  const { runStack } = state;
  const length = runStack.length;

  // 当栈顶run比栈顶第三个都要长，这个时候合并栈顶第二和第三个run
  // 直到保持|C| > |B| + |A|为止
  if (length > 2 && runStack[length - 3].length < runStack[length - 1].length) {
    const curRun = runStack.pop();

    mergeHeadRuns(state);

    // 第二个第二个合并完之后当前的run需要再push回去
    runStack.push(curRun as Run);
  } else {
    mergeHeadRuns(state);
  }
}

/**
 * @description 合并run
 */
function mergeHeadRuns(state: MergeState) {
  const { runStack, array } = state;
  const firRun: Run = runStack.pop() as Run;
  const secRun: Run = runStack[runStack.length - 1];
  // 把栈顶前一个的run合并到第二个run里面
  mergeNeighbor(array, secRun.first, firRun.first, firRun.last, state);
  // 数据需要同步调整
  secRun.last = firRun.last;
  secRun.length += firRun.length;
}

/**
 * @description 归并排序核心，合并两个数组
 */
function mergeNeighbor(
  array: number[],
  first: number,
  connect: number,
  last: number,
  state: MergeState
) {
  const l_length = connect - first;
  const r_length = last - connect;

  // 从左合并还是从又合并取决于两个run的长度，哪边短则合并到那边。
  const func = l_length < r_length ? mergeIntoLeft : mergeIntoRight;

  // 由于两段代码有些比较类似，但是为了方便理解，拆开来较好。
  return func(array, first, connect, last, state);
}

/**
 * @description 将右边的run合并到左边
 * [1, 5]和[2, 3, 6] => [1,2, >2,3,6] => [1,2, 3,>3,6] => [1,2, 3,5,>6]
 */
function mergeIntoLeft(
  array: number[],
  first: number,
  connect: number,
  last: number,
  state: MergeState
) {
  const m: MergeItem = {
    right: array,
    r_cur: connect,
    r_last: last,
    cur: -1,
    l_cur: 0,
    l_last: -1,
    left: [],
  };
  m.cur = binarySearch(array, first, connect - 1, m.right[m.r_cur]);
  m.l_last = connect - m.cur;
  m.left = array.slice(m.cur, connect);

  while (m.l_cur < m.l_last && m.r_cur < m.r_last) {
    const l_val = m.left[m.l_cur];
    const r_val = m.right[m.r_cur];

    if (lessThanEqual(l_val, r_val)) {
      array[m.cur++] = l_val;
      m.l_cur++;
    } else {
      array[m.cur++] = r_val;
      m.r_cur++;
    }
  }

  while (m.l_cur < m.l_last) {
    array[m.cur++] = m.left[m.l_cur++];
  }

  return array;
}

/**
 * @description 将左边的run合并到右边
 * [1, 3, 4]和[2, 5] => [1,3,4<, 4,5] => [1,3<,3, 4,5] => [1,<2,3, 4,5]
 */
function mergeIntoRight(
  array: number[],
  first: number,
  connect: number,
  last: number,
  state: MergeState
) {
  const m: MergeItem = {
    left: array,
    l_cur: connect,
    l_last: last,
    cur: -1,
    r_cur: 0,
    r_last: -1,
    right: [],
  };
  m.cur = binarySearch(array, first, connect - 1, m.right[m.r_cur]);
  m.r_last = connect - m.cur;
  m.right = array.slice(m.cur, connect);

  while (m.l_cur < m.l_last && m.r_cur < m.r_last) {
    const l_val = m.left[m.l_cur];
    const r_val = m.right[m.r_cur];

    if (lessThanEqual(l_val, r_val)) {
      array[m.cur++] = l_val;
      m.l_cur++;
    } else {
      array[m.cur++] = r_val;
      m.r_cur++;
    }
  }

  while (m.l_cur < m.l_last) {
    array[m.cur++] = m.left[m.l_cur++];
  }

  return array;
}

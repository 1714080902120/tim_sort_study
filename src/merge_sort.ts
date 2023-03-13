import { MergeState, Run, MergeItem } from "./../types/timsort.d";
import { binarySearch } from "./binary_search";
import { binarySort } from "./binary_sort";
import { equalTo, lessThan, lessThanEqual, reverse } from "./util";

/**
 * @description timsort核心代码
 */

const MIN_GALLOP = 7; // 初始阈值

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
    minGallop: MIN_GALLOP,
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
 * @param { number } first 按栈顶往下的规则，比如[B, A], A更靠近栈顶。这个first是B的first,因为切割顺序是从左到右，B的切割早于A。
 * @param { number } connect 按栈顶往下的规则，比如[B, A]，这个是A的first，因为切割`run`的过程是从左到右的，所以A实际上是在B之后截取的。
 * @param { number } last 同上描述，这个是A的last
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

// ---------------------------------------merge into left start-------------------------------------

/**
 * @description 左边比较短，这个时候右边合并到左边，这个过程中存在一些不需要参与的元素
 * 找到左边小于等于右边第一个元素的元素的位置
 * 比如：[1, 5]和[2, 3, 6]
 * 此时左边小于等于右边第一个元素的位置是`0`，那么元素`1`可以不参与排序
 * 那么需要排序的元素变成[5]和[2, 3, 6]
 *
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
    galloping: false,
    gallopingOut: false,
    selectLeft: true,
    selectCount: 0,
  };
  // 二分查询找到左边第一个小于等于右边第一个元素的元素的位置
  m.cur = binarySearch(array, first, connect, m.right[m.r_cur]);
  // 截取左边需要排序的个数
  m.l_last = connect - m.cur;
  // 截取左边需要排序的元素
  m.left = array.slice(m.cur, connect);

  // 遍历排序两个数组
  // 左边的从截取位置开始匹配
  // 右边全匹配
  while (m.l_cur < m.l_last && m.r_cur < (m.r_last as number)) {
    if (!m.galloping) {
      mergeLeftOnePairMode(array, state, m);
    } else {
      mergeLeftGallopingMode(array, state, m);
    }
  }

  // 如果这个时候左边还有剩下的元素，那么就说明右边被匹配完了。
  // 剩下的左边元素必定大于任何右边元素，可以直接放到合并的数组后面
  while (m.l_cur < m.l_last) {
    array[m.cur++] = m.left[m.l_cur++];
  }

  return array;
}

/**
 * @description 常规合并到左边，因为存在不需要galloping的场景
 */
function mergeLeftOnePairMode(
  array: number[],
  state: MergeState,
  m: MergeItem
) {
  // 如果左边当前匹配的元素小于等于右边的，那么就找到位置了，将该值插入到里面
  // 否则插入右边当前匹配的元素
  const l_val = m.left[m.l_cur];
  const r_val = m.right[m.r_cur];
  if (lessThanEqual(l_val, r_val)) {
    array[m.cur++] = l_val;
    m.l_cur++;
    // 如果发现是左边的小，这个时候连续被打破，需要切换状态
    modeControlInOnePairMode(state, m, !m.selectLeft);
  } else {
    array[m.cur++] = r_val;
    m.r_cur++;
    modeControlInOnePairMode(state, m, m.selectLeft as boolean);
  }
}

/**
 * @description 使用快速增加模式合并
 * 找到左右两边的连续元素组，然后一次性插入，准确的来说应该是移动到对应的位置，因为都是在同一个数组里操作的
 */
function mergeLeftGallopingMode(
  array: number[],
  state: MergeState,
  m: MergeItem
) {
  if (state.minGallop > 0) state.minGallop--;
  const l_val = m.left[m.l_cur];
  const r_val = m.right[m.r_cur];
  if (lessThanEqual(l_val, r_val)) {
    // 找到左边连续小于等于右边的部分
    const end = gallopFirstSearch(
      m.left,
      m.l_cur + 1,
      m.l_last as number,
      r_val
    );
    modeControlInGallopingMode(state, m, end - m.l_cur);
    // 将这部分连续的元素都插入到对应的位置
    while (m.l_cur < end) array[m.cur++] = m.left[m.l_cur++];
  } else {
    // 找到右边连续小于左边的部分
    const end = gallopFirstSearch(
      m.right,
      m.r_cur + 1,
      m.r_last as number,
      l_val
    );
    modeControlInGallopingMode(state, m, end - m.r_cur);
    // 将这部分连续的元素都插入到对应的位置
    while (m.r_cur < end) array[m.cur++] = m.right[m.r_cur++];
  }
}


// ---------------------------------------merge into left end-------------------------------------



// ---------------------------------------merge into right start-------------------------------------

/**
 * @description 右边比较短，左边合并到右边，这个过程存在一些不需要参与的元素。
 * 找到右边大于左边最后一个元素的元素的位置
 * 比如：[1, 3, 4]和[2, 5]
 * 此时找到右边的位置是`1`，那么元素`5`不需要参与排序
 * 那么就变成[1, 3, 4]和[2]的排序
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
    l_first: first,
    cur: -1,
    r_cur: 0,
    r_first: 0,
    right: [],
    galloping: false,
    gallopingOut: false,
    selectLeft: true,
    selectCount: 0,
  };
  // 找到右边第一个大于左边最后一个元素的元素的位置
  m.cur = binarySearch(array, connect, last, m.left[m.l_cur - 1]);
  // 截取需要排序的部分
  m.right = array.slice(connect, m.cur);
  // 截取需要排序的个数
  m.r_cur = m.cur - connect;

  // 遍历两个数组，左边的全参与，右边仅截取的部分参与
  while ((m.l_first as number) < m.l_cur && (m.r_first as number) < m.r_cur) {
    if (!m.galloping) {
      mergeRightOnePairMode(array, state, m);
    } else {
      mergeRightGallopingMode(array, state, m);
    }
  }

  // 最后如果右边还有剩余的元素，那么就说明右边的元素一定都小于左边的元素，可以直接放到数组的最前面。
  while ((m.r_first as number) < m.r_cur) {
    array[--m.cur] = m.right[--m.r_cur];
  }

  return array;
}

/**
 * @description 常规合并到右边
 */
function mergeRightOnePairMode(
  array: number[],
  state: MergeState,
  m: MergeItem
) {
  // 如果右边当前匹配的元素的小于左边当前匹配的位置，那么就找到位置了，插入左边的值
  // 否则插入右边元素
  const l_val = m.left[m.l_cur - 1];
  const r_val = m.right[m.r_cur - 1];
  if (lessThan(r_val, l_val)) {
    array[--m.cur] = l_val;
    --m.l_cur;
    modeControlInOnePairMode(state, m, !m.selectLeft);
  } else {
    array[--m.cur] = r_val;
    --m.r_cur;
    modeControlInOnePairMode(state, m, m.selectLeft as boolean);
  }
}

/**
 * @description 快速增长模式下合并
 * 获取两边连续的部分，然后批量将它们合并
 */
function mergeRightGallopingMode(
  array: number[],
  state: MergeState,
  m: MergeItem
) {

  if (state.minGallop > 0) state.minGallop--;
  const l_val = m.left[m.l_cur - 1];
  const r_val = m.right[m.r_cur - 1];

  if (lessThan(r_val, l_val)) {
    // 获取右边连续小于左边的元素，也就是左边连续大于等于右边的部分
    const begin = gallopLastSearch(
      m.left,
      m.l_first as number,
      m.l_cur - 1,
      r_val
    );
    modeControlInGallopingMode(state, m, m.l_cur - begin);
    // 批量移动
    while (begin < m.l_cur) array[--m.cur] = m.left[--m.l_cur];
  } else {
    // 获取右边连续大于等于左边的元素
    const begin = gallopLastSearch(
      m.right,
      m.r_first as number,
      m.r_cur - 1,
      l_val
    );
    modeControlInGallopingMode(state, m, m.r_cur - begin);
    // 批量移动
    while (begin < m.r_cur) array[--m.cur] = m.right[--m.r_cur];
  }
}

// ---------------------------------------merge into right end-------------------------------------

/**
 * @description 切换收集的状态，如果连续达到galloping个，那么就切换`galloping`状态。
 */
function modeControlInOnePairMode(
  state: MergeState,
  m: MergeItem,
  selectSwitched: boolean
) {
  if (selectSwitched) {
    m.selectLeft = !m.selectLeft;
    m.selectCount = 0;
  }
  m.selectCount++;
  if (m.selectCount >= state.minGallop) {
    m.galloping = true;
    m.selectCount = 0;
  }
}

/**
 * @description 当galloping可操作数量小于最小阈值，此时停止galloping，回归常规合并
 */
function modeControlInGallopingMode(
  state: MergeState,
  m: MergeItem,
  gallopSize: number
) {
  if (gallopSize < MIN_GALLOP) {
    if (m.gallopingOut) {
      m.galloping = false;
      m.gallopingOut = false;
      state.minGallop++;
    } else {
      m.gallopingOut = true;
    }
  } else {
    m.gallopingOut = false;
  }
}

/**
 * @description 找到一组连续小于/大于(等于)的元素，方向是正常的左到右
 */
function gallopFirstSearch(
  array: number[],
  first: number,
  last: number,
  value: number
): number {
  let pre = 0;
  let offset = 1;
  while (first + offset < last) {
    if (lessThan(value, array[first + offset])) break;
    pre = offset;
    offset = (offset << 1) + 1;
  }
  const searchFirst = first + pre;
  const searchLast = first + offset < last ? first + offset : last;
  // 找到第一个元素在整个数组中的位置
  return binarySearch(array, searchFirst, searchLast, value);
}


/**
 * @description 也是找到一组连续的元素，但是方向是从右到左，也就是从后往前
 */
function gallopLastSearch(
  array: number[],
  first: number,
  last: number,
  value: number
) {
  let pre = 0;
  let offset = 1;
  while (first < last - offset) {
      if (!lessThan(value, array[last - offset])) break;
      pre = offset;
      offset = (offset << 1) + 1;
  }
  const searchFirst = (first < last - offset) ? last - offset : first;
  const searchLast = last - pre;
  return binarySearch(array, searchFirst, searchLast, value);
}

# tim_sort_study
tim_sort_study_with_typescript
link: preparing...

base knowledge
`Timsort`最合适的描述是一种自适应稳定的归并排序([Mergesort]([Merge sort - Wikipedia](https://en.wikipedia.org/wiki/Merge_sort)))变体(`variant`)。

尽管其中的原理更加复杂，基础的理论是比较容易理解的。官方也有提供相关描述： [the man himself](https://github.com/python/cpython/blob/master/Objects/listsort.txt)或者 [Wikipedia page](https://en.wikipedia.org/wiki/Timsort)。

归并排序一般是基于递归(`recursive`)的方式实现，而`Timsort`则是通过迭代(`iteratively`)的方式实现。

`Timsort`会从左往右的处理数组，找到一个所谓的(`so-called`)的`runs`。一个`run`是简单的已经排序好了的序列。这里面包含一些`the wrong way`排序的子序列，它们可以通过简单的方式排序，比如倒序。

在分拣过程开始时，根据输入的长度确定最小运行长度。如果`Timsort`无法找到一个最小的运行长度，那么它将使用插入排序([`Insertion sort`]([Insertion sort - Wikipedia](https://en.wikipedia.org/wiki/Insertion_sort)))"人工增压"(`boosted artificially`)。

所以简单的说，这个算法最基础的理论实际上是插入排序 + 归并排序。

不过和归并排序不同的是，这里合并的`runs`的长度不是固定的，这么做的好处是合并的量不会太大，因而减少了比对的时间。

## 合并准则

以这种方式找到的`run`会被栈跟踪，这个栈会记录开始的索引和每个`run`的长度。

每一次栈里面的`runs`都会合并到一起知道这里面只有一个`run`为止。`Timsort`尝试去维持一个平衡当它开始决定哪个`run`将被合并。

啥平衡呢？

一方面，我们希望能尽早的合并那些大概率已经在缓存中的`runs`，另一方面我们希望合并的尽量晚点以充分的利用可能出现在数据中的模式(`patterns`)。

为了实现这一点，`Timsort`维持了两个变体。

假设`A`、`B`和`C`是三个处于栈顶端的`run`。

- `|C| > |B| + |A|`
- `|B| > |A|`

该图显示了` |A| > |B|`因此，`B `与两个运行中较小的一个合并。

这里有一点需要注意，`Timsort`置灰合并连续的(`consecutive`)`runs`，这对于保证稳定性来说是必须的。否则，相等的元素将在多个`runs`之间转移。



第一个变体确保`run`的长度增长至少和斐波那契数列([`Fibonacci numbers`]([Fibonacci number - Wikipedia](https://en.wikipedia.org/wiki/Fibonacci_number)))一样快,当我们知道数组的最大长度时，给出栈的限制大小。

那么最好的情况的时间复杂度已经可以知道了，那就是只有一个`run`的时候，不需要合并，此时时间复杂度是`O(n)`。而最差的情况的时间复杂度是`O(n log n)`。

这些算法属性以及稳定性使得`v8`引擎放弃了快排选择了`Timsort`。



## 合并空间损耗

原来的归并排序实现是`not-in-place`的，它的空间复杂度是`O(N)`。有基于就地算法实现的归并排序，但是它时间上的损耗较高。`Timsort`结合了这两种情况，它的时间复杂度稍微超出了归并排序的时间复杂度，但是它的空间复杂度也降低到稍微超出了`O(N)`。

最初，`Timsort`采用二分查询([binary search](https://en.wikipedia.org/wiki/Binary_search))查找第二个`run`的第一个元素插入到第一个有序的`run`的位置，这样保持了它的有序。

然后，它采用相同的算法去查找第一个`run`的最后一个元素插入到第二个`run`里的位置，也保持了它的有序。

元素在这俩区间之外的都已经是排序好了的。

## 合并方向

从左到右或者从右到左都可以。

## 合并过程中的快速增加模式

`R1`和`R2`俩`run`的合并是独立的，这个过程中记录的选择的连续元素的个数是保留着的。

当这个数字达到了最小的增加阈值(`minimum galloping threshold(min_gallop)`). `Timsort`会将这视作还有很多连续的元素正准备被选择，然后切换到`galloping mode`。

让我们假设下`R1`负责触发它。在这种模式下，算法会变现为一个指数搜索([exponential search](https://en.wikipedia.org/wiki/Exponential_search))，也被叫做`galloping search`，用于查找`R1`中`R2`的下一个元素`x`。

通过两步来实现：

1. 查找`x`所在的范围`(2^k - 1, 2^(k + 1) - 1)`。
2. 二分查询这个元素。

这个模式是一种尝试使合并算法在`run`元素之间适应的间隔模式(`pattern of intervals`)。

它并非一直都有效。在一些场景中快速增加模式需要做比线性搜索([linear search](https://en.wikipedia.org/wiki/Linear_search))更多的比较(`comparisons`)。

根据开发者做的`benchmarks`，仅当第一个`run`的初始元素不是另一个`run`前七个元素才有效。

这意味着初始的阈值是`7`。

为了避免这个问题，采纳了以下两个行为：

1. 当`galloping`查找效率比二分查询低的时候，`galloping mode`会中断。
2. 失败或者成功的`galloping`都会被用于矫正`min_gallop`。如果选择的元素是来自之前返回的元素所在的数组，`min_gallop`会减`1`, 否则增加`1`，减少/增加会慢慢使我们的合并算法回`galloping mode`。而对于随机数据来说，这个`min_gallop`会变得非常大导致无法回归`galloping mode`。

## 递降的`runs`

为了充分利用递降的排序，`Timsort`会完全反转递降的`runs`当它发现了它们并且将它们加入到`runs stack`里面。

由于递降的`runs`会被直接反转，因此排除具有相同元素的`runs`可以保持算法的稳定性，即相等的元素不会被反转。

## 最小的`run`的大小

当`runs`的数量等于或者稍微小于二的幂(`a power of two`)的时候合并的效率是最高的，而当稍微大于二的幂的时候，效率会显著的减少。因此，`Timsort`选择最小`run`(`minrun`)用来确保合并效率。

`minrun`是从`[32, 64]`范围之间选择出来的，而数据的大小会根据这个`minrun`分割，基本等于或者稍微小于二的幂次。

最终算法采用数组大小的六个最高有效位，如果设置了任何剩余位，则添加一个，并将该结果用于`minrun`。

这个算法适用于所有的数组，包括小于`64`的。对于大小为`63`或者更小的数组，这会将`minrun`设置为等于数组大小，并将`Timsort`简化为插入排序。

## 分析

最坏的情况`Timsort`的时间复杂度是`O(nlogn)`，当数组全然无序的情况。

而最好的情况则是`O(n)`，传入的数组已经是排序完毕了的。

`Timsort`再对对象或者指针进行排序的方面优于快排，因为快排需要昂贵的内存空间间接的寻址来访问数据和执行比较，使得快排的缓存一致性优势大大降低。

## 步骤

提前需要了解的

1. 二分查询算法
2. 插入排序算法
3. 归并排序算法


然后我们来分析下执行的流程

1. 首先自然是判断数组的长度，当小于2的时候完全没必要排序，直接`return`；

2. 循环这个数组；

3. 找到这个数组中的一个有序子序列，它将作为我们的`run`；

4. 根据数组的长度计算`minrun`，在`[32 - 64]`之间；

5. 对比当前`run`的长度和`minrun`，如果`currentRunLength`小于`minRunLength`，那么这个时候使用插入排序把这个`run`补充到长度为`minRunLength`；

6. 将`run`压入栈中；

7. 保证栈内的任意从下到上的三个`run`满足规则：

   - `|C| > |B| + |A|`
   - `|B| > |A|`

   如果不满足，合并其中两个较小的，如果还不满足，继续合并直到满足规则；

8. 如果此时没有剩余子数组了，说明可以结束循环了；

9. 合并栈里面所有的`run`，排序结束。





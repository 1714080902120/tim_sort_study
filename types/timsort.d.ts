export interface MergeState {
    array: number[];
    remain: number;
    last: number;
    runStack: Run[];
    minrun: number;
    minGallop: number;
}

export interface Run {
    first: number;
    last: number;
    length: number;
}

export interface MergeItem {
    right: number[]; // 右边run
    left: number[]; // 左边run

    l_first?: number; // 左数组最开始索引位置
    r_first?: number; // 右数组最开始索引位置

    l_last?: number; // 左数组最后索引位置
    r_last?: number; // 右数组最后索引位置

    l_cur: number; // 左数组当前索引位置
    r_cur: number; // 右数组当前索引位置

    cur: number; // 整体上当前的位置

    galloping: boolean;
    gallopingOut: boolean;
    selectLeft?: boolean;
    selectCount: number;
}

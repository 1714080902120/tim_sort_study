export interface MergeState {
    array: number[];
    remain: number;
    last: number;
    runStack: Run[];
    minrun: number;
}

export interface Run {
    first: number;
    last: number;
    length: number;
}

export interface MergeItem {
    right: number[]; // 右边run
    left: number[]; // 左边run

    l_last: number; // 
    r_last: number; // 

    l_cur: number; // 
    r_cur: number; // 

    cur: number; //
}
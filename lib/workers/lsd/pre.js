Module['gray'] = ({ data, width, height }) => {
    const arr = new Float64Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        // arr[i/4] = 0.299 * data[i] + 0.587 * data[i+1]+ 0.114 * data[i+2];
        arr[i/4] = data[i];
    }
    return arr;
};
Module['chunk'] = (input = [], size = 7) => {
    const result = [];
    const len = input.length;
    for (let i = 0; i < len; i += size) {
        result.push(input.slice(i, i + size));
    }
    return result;
};
Module['translate'] = ({ data, width, height }) => {
    let lines;
    let resultPtr;
    let countPtr = Module._malloc(8);
    const dataPtr = Module._malloc(width * height * 8);
    const grayData = Module.gray({ data, width, height});

    try {
        Module.HEAPF64.set(grayData, dataPtr / 8);
        resultPtr = Module._lsd(countPtr, dataPtr, width, height);
        // const len = Module.getValue(countPtr, 'i32');
        const len = Module.HEAP32[countPtr >> 2]
        lines = Module.chunk(
            Module.HEAPF64.subarray(resultPtr / 8, resultPtr / 8 + len * 7),
        );
    } finally {
        Module._free(dataPtr);
        Module._free(countPtr);
        if(resultPtr) {
            Module._free(resultPtr);
        }
    }
    return lines;
};

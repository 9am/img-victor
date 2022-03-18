const gray = ({ data, width, height }) => {
    const arr = new Float64Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        arr[i/4] = data[i];
    }
    return arr;
};
const chunk = (input = [], size = 7) => {
    const result = [];
    const len = input.length;
    for (let i = 0; i < len; i += size) {
        result.push(input.slice(i, i + size));
    }
    return result;
};
const excute = ({ data, width, height }) => {
    let lines;
    let resultPtr;
    let countPtr = Module._malloc(8);
    const dataPtr = Module._malloc(width * height * 8);
    const grayData = gray({ data, width, height});

    try {
        Module.HEAPF64.set(grayData, dataPtr / 8);
        resultPtr = Module._lsd(countPtr, dataPtr, width, height);
        const len = Module.HEAP32[countPtr >> 2]
        lines = chunk(
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
const fix = (arr, digit = 1) => arr.map(num => +num.toFixed(digit));
const groupLines = (lines = []) => {
    if (!lines.length) {
        return [];
    }
    let [l, ...rest] = [...lines];
    let result = [[l]];
    let repeat = 0;
    while (rest.length) {
        const [, , x, y] = l;
        const [index, d, next] = rest.reduce((memo, line, i) => {
            const x1 = line[0];
            const y1 = line[1];
            const x2 = line[2];
            const y2 = line[3];
            // const [x1, y1, x2, y2] = line;
            const dist1 = Math.hypot(x1 - x, y1 - y);
            const dist2 = Math.hypot(x2 - x, y2 - y);
            const dist = Math.min(dist1, dist2);
            return dist < memo[1]
                ? [i, dist, dist === dist2 ? fix([x2, y2, x1, y1]) : fix(line)]
                : memo;
        }, [0, Number.MAX_SAFE_INTEGER]);
        if (d < 15) {
            result[result.length - 1].push(next);
            repeat = 0;
            rest.splice(index, 1);
            l = next;
        } else {
            if (repeat === 2) {
                result.push([next]);
                repeat = 0;
                rest.splice(index, 1);
                l = next;
            } else {
                const [a, b, c, d] = result[result.length - 1].slice(-1)[0];
                const [ox, oy] = [Math.random() * 5, Math.random() * 5];
                const back = fix([c, d, a + (ox > 2 ? 1 : -1) * ox, b + (ox > 2 ? 1 : -1) * oy]);
                result[result.length - 1].push(back);
                repeat++;
                l = back;
            }
        }
    }
    return result;
};
Module['gray'] = gray;
Module['chunk'] = chunk;
Module['excute'] = excute;
Module['fix'] = fix;
Module['groupLines'] = groupLines;

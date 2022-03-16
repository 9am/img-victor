const LSD = Module();

const fix = (arr, digit = 1) => arr.map(num => +num.toFixed(digit))

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
            const [x1, y1, x2, y2] = line;
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

self.onmessage = async evt => {
    const { translate } = await LSD;
    const lines = translate(evt.data);
    const groups = groupLines(lines);
    postMessage([lines, groups]);
};

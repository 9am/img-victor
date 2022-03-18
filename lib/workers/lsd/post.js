const LSD = Module();

self.onmessage = async evt => {
    const { excute, groupLines } = await LSD;
    const lines = excute(evt.data);
    const groups = groupLines(lines);
    postMessage([lines, groups]);
};

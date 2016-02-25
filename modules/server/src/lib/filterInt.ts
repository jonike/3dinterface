// Strict parseInt
export function filterInt(value : string) : number {
    if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
        return Number(value);
    return NaN;
};

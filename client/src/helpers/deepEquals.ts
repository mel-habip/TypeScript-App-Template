/**
 *  allows us to compare any two values
 *  courtesy of https://dmitripavlutin.com/how-to-compare-objects-in-javascript/ but modified!
 */
export default function deepEquals(item1: any, item2: any): boolean {
    const keysof = Object.keys,
        type1 = typeof item1,
        type2 = typeof item2;
    return item1 && item2 && type1 === 'object' && type1 === type2 ? (
        keysof(item1).length === keysof(item2).length &&
        keysof(item1).every(key => deepEquals(item1[key], item2[key]))
    ) : (item1 === item2);
};
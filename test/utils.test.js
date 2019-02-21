import { negate, jsonParse, getParamStrFromObj } from '@/utils'

test('negate', () => {
    const isEven = n => n % 2 === 0
    const isOdd = negate(isEven)

    expect(isOdd(1)).toBe(true)
    expect(isOdd(2)).toBe(false)
    expect(isOdd(200)).toBe(false)
    expect(isOdd(201)).toBe(true)
})

test('jsonParse', () => {
    const obj = { steve: 'young' }
    const str = JSON.stringify(obj)

    expect(jsonParse()).toBe(undefined)
    expect(jsonParse(null)).toBe(null)
    expect(jsonParse(undefined)).toBe(undefined)
    expect(jsonParse({})).toEqual({})
    expect(jsonParse(str)).toEqual(obj)
})

test('getParamStrFromObj', () => {
    expect(getParamStrFromObj()).toBe('')
    expect(getParamStrFromObj({})).toBe('')
    expect(getParamStrFromObj({ a: 1, b: 2 })).toBe('a=1&b=2')
    expect(getParamStrFromObj({ a: 1, b: 2, c: '哈喽' })).toBe('a=1&b=2&c=%E5%93%88%E5%96%BD')
})

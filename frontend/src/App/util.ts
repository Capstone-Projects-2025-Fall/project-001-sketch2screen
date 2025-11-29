function generateDiff(oldObject: any, newObject: any) {
  if (oldObject === newObject) {
    return undefined
  }
  if(newObject === null || newObject === undefined) return null
  if(oldObject === null || oldObject === undefined) return newObject
  let retval: any = {}
  if(typeof newObject !== 'object' || oldObject === null) {
    return newObject
  }
  for(const [key, value] of Object.entries(oldObject)) {
    if(Object.hasOwn(newObject, key)) {
      let diff: any = generateDiff(value, newObject[key])
      if(diff !== undefined) {
        retval[key] = diff
      }
    } else {
      retval[key] = null
    }
  }
  for(const [key, value] of Object.entries(newObject)) {
    if(!Object.hasOwn(oldObject, key)) {
      retval[key] = value
    }
  }
  if(Object.entries(retval).length === 0) {
    return undefined
  }
  return retval
}

function applyDiff(a: any, diff: any) {
  if(typeof diff !== 'object' || typeof a !== 'object' || a === null || diff === null) return diff;
  if(diff instanceof Map) {
    if(a instanceof Map) return new Map([...a, ...diff]);
    return diff;
  }
  let retval: any = {}
  if(Array.isArray(a)) {
    retval = []
  }
  let isArray: boolean = false
  for(const [key, value] of Object.entries(a)) {
    if(typeof key === 'number') {
      isArray = true
    }
    if(Object.hasOwn(diff, key)) {
      let applied = applyDiff(value, diff[key])
      if(applied !== null) retval[key] = applied
    } else {
      retval[key] = value
    }
  }
  for(const [key, value] of Object.entries(diff)) {
    if(typeof key === 'number') {
      isArray = true
    }
    if(!Object.hasOwn(a, key)) {
      if(value !== null) retval[key] = value
    }
  }
  if(isArray) return [...retval]
  return retval
}

function clone(a: any): any {
  return JSON.parse(JSON.stringify(a));
}

export {generateDiff, applyDiff, clone}

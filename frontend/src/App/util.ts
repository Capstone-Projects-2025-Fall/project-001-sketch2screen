import type { SceneData } from "./Drawing";
function generateDiff(oldObject: any, newObject: any) {
  if(Array.isArray(newObject)) {
    if(!Array.isArray(oldObject) || oldObject.length !== newObject.length) {
      console.log("newArray");
      return newObject;
    }
  }
  if (oldObject === newObject) {
    return undefined
  }
  if(newObject === null || newObject === undefined) return null;
  if(oldObject === null || oldObject === undefined) return newObject;
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
      if(value !== undefined) retval[key] = value;
    }
  }
  if(Object.entries(retval).length === 0) {
    return undefined
  }
  return retval
}

function applyDiff(a: any, diff: any, arrayify?: boolean) {
  if(a === null || a === undefined) a = {};
  if(diff === null) return null;
  if(diff === undefined) return a;
  if(typeof diff !== 'object' || typeof a !== 'object') return diff;
  if(diff instanceof Map) {
    if(a instanceof Map) return new Map([...a, ...diff]);
    return diff;
  }
  let retval: any = {}
  let isArray: boolean = false
  if(Array.isArray(a)) return diff;
  for(const [key, value] of Object.entries(a)) {
    if(typeof key === 'number' || !Number.isNaN(parseInt(key))) {
      isArray = true
    }
    if(Object.hasOwn(diff, key)) {
      let applied = applyDiff(value, diff[key], arrayify)
      if(applied !== null) retval[key] = applied
    } else {
      retval[key] = value
    }
  }
  for(const [key, value] of Object.entries(diff)) {
    if(typeof key === 'number' || !Number.isNaN(parseInt(key))) {
      isArray = true
    }
    if(!Object.hasOwn(a, key)) {
      if(value !== null) retval[key] = value
    }
  }
  if(isArray && arrayify) return Object.values(retval)
  return retval
}

function clone(a: any): any {
  return JSON.parse(JSON.stringify(a));
}

function generateSceneDiff(oldScene: SceneData, newScene: SceneData): any {
  let oldElementsMap: any = {}
  let newElementsMap: any = {}

  for(const element of oldScene.elements) {
    if(!element.id) continue;
    oldElementsMap[element.id] = element;
  }

  for(const element of newScene.elements) {
    if(!element.id) continue;
    newElementsMap[element.id] = element;
  }

  let elementsDiff = generateDiff(oldElementsMap, newElementsMap);
  console.log("DIFFERENCE", elementsDiff);

  let appStateDiff = generateDiff(oldScene.appState, newScene.appState);
  let filesDiff = generateDiff(oldScene.files, newScene.files);

  if(
    elementsDiff === undefined &&
    appStateDiff === undefined &&
    filesDiff === undefined
    ) return undefined;

  return {
    appState: newScene.appState,
    elements: elementsDiff,
    files: filesDiff,
  }
}

function applySceneDiff(base: any, diff: any, stack: boolean): SceneData {
  let appliedElements;
  if(stack) {
    appliedElements = applyDiff(base.elements, diff.elements, false);
  } else {
    appliedElements = [...base.elements];
    if(diff.elements) for(const [id, element] of Object.entries(diff.elements) as [id: string, element: any]) {
      if(!id) continue;
      if(element?.status) {
        //element.status = "saved";
        //element.link = "";
      }
      if(!Array.isArray(element.groupIds)) element.groupIds = [];
      let index = appliedElements.findIndex(e => e.id === id)
      if(index !== -1) {
        let appliedElement = applyDiff(appliedElements[index], element, true);
        if(appliedElement) appliedElements[index] = appliedElement;
      } else {
        if(element?.id) appliedElements.push(element);
        else {
          console.log("bad element", element);
        }
      }
    }
  }

  let appliedFiles = applyDiff(base.files, diff.files);

  return {
    appState: diff.appState,//applyDiff(base.appState, diff.appState, !stack),
    elements: appliedElements,
    files: appliedFiles,
  }
}

export {generateSceneDiff, applySceneDiff, clone}

export interface Preferences { largeText: boolean; shortcuts: boolean; allEffects: boolean }
const key='crossroads-reading-controls';
export const defaultPreferences:Preferences={largeText:false,shortcuts:true,allEffects:false};
export function loadPreferences():Preferences {
 try {const value=JSON.parse(localStorage.getItem(key)??'null');return Object.fromEntries(Object.entries(defaultPreferences).map(([name,fallback])=>[name,typeof value?.[name]==='boolean'?value[name]:fallback])) as unknown as Preferences;}
 catch{return {...defaultPreferences};}
}
export function savePreferences(value:Preferences){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Preferences remain available for this visit. */}}

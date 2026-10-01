import { parseCampaign, serializeCampaign } from './save';
import type { JourneyState } from '../types';
export const SAVE_KEY='crossroads-silk-roads-v1';
const BACKUP_KEY='crossroads-silk-roads-before-v4';
export interface SavedCampaign {state:JourneyState|null;notice:string;blocked:boolean;raw:string|null}
export function loadStoredCampaign():SavedCampaign {
  try {
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return {state:null,notice:'',blocked:false,raw:null};
    const result=parseCampaign(raw);
    if(!result.ok)return {state:null,notice:`Your saved file could not be restored: ${result.error} It has been kept unchanged.`,blocked:true,raw};
    if(result.migrated){
      try {if(!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,raw);}
      catch{return {state:result.state,notice:'Your older save is open, but a backup could not be stored. Autosave is paused; export a journey file to keep your progress.',blocked:true,raw};}
    }
    return {state:result.state,notice:result.migrated?'Older journey restored and backed up. Its original gameplay rules and recorded choices are preserved.':'',blocked:false,raw};
  }catch{return {state:null,notice:'Browser storage is unavailable. You can play and export a journey file to keep your progress.',blocked:false,raw:null};}
}
export function saveStoredCampaign(state:JourneyState):boolean {
  try {localStorage.setItem(SAVE_KEY,serializeCampaign(state));return true;}catch{return false;}
}

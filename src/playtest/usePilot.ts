import { useEffect, useRef, useState } from 'react';
import type { JourneyState } from '../types';
import { finishPilot, loadPilot, recordPilotChoice, savePilot, type PilotSession } from './session';
export function usePilot(game:JourneyState|null,administrativeOpen=false){
 const [loaded]=useState(loadPilot);
 const [pilot,setPilot]=useState<PilotSession|null>(()=>{
  if(loaded?.phase==='playing'&&(!game||loaded.mode!==game.mode||loaded.rulesVersion!==(game.rulesVersion??1)||game.decisions.length!==loaded.trials.length||loaded.trials.some((trial,index)=>trial.encounterId!==game.decisions[index]?.encounterId||trial.choiceId!==game.decisions[index]?.choiceId)))return finishPilot({...loaded,interrupted:true},false,game?.contracts.route??'undecided');
  return loaded;
 });
 const [storageFailed,setStorageFailed]=useState(false);
 const clock=useRef({key:'',ms:0,start:null as number|null,help:0,incomplete:loaded?.phase==='playing'&&game?.status==='playing'&&!game.lastOutcome});
 const key=game?.status==='playing'&&!game.lastOutcome?`${pilot?.id??'none'}:${game.chapter}:${game.encounterIndex}`:'';
 useEffect(()=>{if(pilot&&!savePilot(pilot))setStorageFailed(true);},[pilot]);
 useEffect(()=>{
  const value=clock.current;
  const stop=()=>{if(value.start!==null){value.ms+=performance.now()-value.start;value.start=null;}};
  stop();if(value.key!==key){if(value.key)value.incomplete=false;value.key=key;value.ms=0;value.help=0;}
  const update=()=>{stop();if(key&&!administrativeOpen&&pilot?.phase==='playing'&&!pilot.paused&&document.visibilityState==='visible')value.start=performance.now();};
  update();document.addEventListener('visibilitychange',update);return()=>{stop();document.removeEventListener('visibilitychange',update);};
 },[key,pilot?.phase,pilot?.paused,pilot?.id,administrativeOpen]);
 useEffect(()=>{if(pilot?.phase==='playing'&&game?.status==='campaign-complete')setPilot(current=>current?finishPilot(current,true,game.contracts.route):null);},[game?.status,pilot?.phase]);
 const record=(encounterId:string,choiceId:string)=>{const c=clock.current;const activeMs=Math.min(14_400_000,Math.round(c.ms+(c.start===null?0:performance.now()-c.start)));setPilot(current=>current?recordPilotChoice(current,{encounterId,choiceId,activeMs,helpOpens:c.help,...(c.incomplete?{timingIncomplete:true}:{})}):null);c.ms=0;c.start=null;c.incomplete=false;};
 const help=()=>{if(pilot?.phase==='playing'&&key&&!pilot.paused)clock.current.help=Math.min(100,clock.current.help+1);};
 const interrupt=()=>setPilot(current=>current?.phase==='playing'?finishPilot({...current,interrupted:true},false,game?.contracts.route??'undecided'):current);
 return {pilot,setPilot,storageFailed,record,help,interrupt};
}

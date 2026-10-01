import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { serializeCampaign, type CampaignImportResult } from '../game/save';
import { createImportReader } from '../game/importReader';
import type { JourneyState } from '../types';
export function downloadText(text:string,filename:string) {
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function CampaignTransfer({state,onImport}: {state:JourneyState|null;onImport:(state:JourneyState,notice?:string)=>void}) {
  const input=useRef<HTMLInputElement>(null);
  const reader=useRef(createImportReader());
  const [reading,setReading]=useState(false);
  useEffect(()=>{const active=reader.current;return ()=>active.cancel();},[]);
  const [message,setMessage]=useState('');
  const [pending,setPending]=useState<Extract<CampaignImportResult,{ok:true}>|null>(null);
  const restore=async(file?:File)=>{
    if(!file)return;
    setPending(null);
    setReading(true);setMessage('Reading campaign file...');
    const result=await reader.current.read(file);
    if(!result)return;
    setReading(false);
    if(!result.ok){setMessage(result.error);return;}
    setPending(result);setMessage('');
  };
  return <section className="campaign-transfer" aria-label="Save and restore"><div><h3>Take your journey with you.</h3><p>A portable file keeps your campaign without an account.</p></div><div className="transfer-actions">{state&&<button className="secondary" onClick={()=>{try{downloadText(serializeCampaign(state),`crossroads-chapter-${state.chapter}.json`);setMessage('Campaign download requested. Keep the file to restore this journey.');}catch{setMessage('This journey could not be exported. Your current autosave has been kept.');}}}><Download size={16}/> Export journey</button>}<button className="secondary" onClick={()=>input.current?.click()}><Upload size={16}/> Import journey</button><input ref={input} type="file" accept="application/json,.json" aria-label="Campaign file" hidden onChange={event=>{void restore(event.target.files?.[0]);event.target.value='';}}/></div>{reading&&<button className="secondary" onClick={()=>{reader.current.cancel();setReading(false);setMessage('Import cancelled. Your current journey is unchanged.');}}>Cancel import</button>}{message&&<p className="transfer-message" role="status">{message}</p>}{pending&&<div className="import-preview"><h4>Restore chapter {pending.state.chapter}?</h4><p>{pending.state.decisions.length} decisions · {pending.state.mode==='challenge'?'Caravan challenge':'Story journey'}. {state?'This will replace the current autosave. Export it first if you want to keep both.':'Your campaign will resume from this point.'}</p>{pending.migrated&&<p>Older save: review the compatibility notes below before restoring.</p>}{pending.warnings?.map(warning=><p key={warning} className="small-note">{warning}</p>)}<div className="action-row"><button className="primary" onClick={()=>{onImport(pending.state,pending.migrated?'Older campaign restored with compatibility notes. Its saved progress and original economic rules are preserved.':'Campaign restored.');setPending(null);}}>Restore this journey</button><button className="secondary" onClick={()=>{reader.current.cancel();setPending(null);}}>Keep current journey</button></div></div>}</section>;
}

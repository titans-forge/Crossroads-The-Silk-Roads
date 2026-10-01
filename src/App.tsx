import { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, Compass, RotateCcw, X, Download, Settings } from 'lucide-react';
import { sourceFraming } from './data/learning';
import { acknowledgeOutcome, choose, continueToBactra, continueToDunhuang, continueToKashgar, continueToPamirs, createInitialState, getEncounter, recordReflection } from './game/engine';
import { loadStoredCampaign, saveStoredCampaign } from './game/storage';
import type { GameMode, JourneyState, PersonId } from './types';
import { DecisionPanel } from './components/DecisionPanel';
import { OutcomePanel } from './components/OutcomePanel';
import { TravelerRail } from './components/TravelerRail';
import { ResourceRail } from './components/ResourceRail';
import { RouteStrip } from './components/RouteStrip';
const JourneyLedger=lazy(()=>import('./components/JourneyLedger').then(module=>({default:module.JourneyLedger})));
const PlaytestPanel=lazy(()=>import('./components/PlaytestPanel').then(module=>({default:module.PlaytestPanel})));
import { ReadingControls } from './components/ReadingControls';
import { loadPreferences, savePreferences } from './game/preferences';
import { usePilot } from './playtest/usePilot';
import { Modal } from './components/Modal';
import { Onboarding } from './components/Onboarding';
import { Debrief } from './components/Debrief';
import { CampaignTransfer, downloadText } from './components/CampaignTransfer';

import { JourneyScene, journeyScene } from './components/JourneyScene';
type Panel='landscape'|'journal'|'context'|'restart'|'import'|'settings'|'playtest'|PersonId|null;
export default function App(){
 const [loaded]=useState(loadStoredCampaign);
 const [state,setState]=useState<JourneyState|null>(loaded.state);
 const [preferences,setPreferences]=useState(loadPreferences);
 const [panel,setPanel]=useState<Panel>(null);
 const pilotMonitor=usePilot(state,['settings','restart','playtest','import'].includes(panel??''));
 const {pilot,setPilot}=pilotMonitor;
 useEffect(()=>savePreferences(preferences),[preferences]);
 const [notice,setNotice]=useState(loaded.notice);
 const [saveBlocked,setSaveBlocked]=useState(loaded.blocked);

 const [pendingMode,setPendingMode]=useState<GameMode>('story');
 useEffect(()=>{if(state&&!saveBlocked&&!saveStoredCampaign(state))setNotice('Autosave is unavailable. Export your journey from Atlas & journal to keep your progress.');},[state,saveBlocked]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[state?.chapter,state?.encounterIndex,state?.status,Boolean(state?.lastOutcome)]);
 const close=()=>setPanel(null);
 const open=(value:Panel)=>{if(['journal','context','settings'].includes(value??''))pilotMonitor.help();setPanel(value);};
 const replaceJourney=(mode:GameMode)=>{setState(createInitialState(mode));setSaveBlocked(false);setPanel(null);setNotice('');};
 const start=(mode:GameMode)=>{if(loaded.raw&&saveBlocked){setPendingMode(mode);setPanel('restart');return;}replaceJourney(mode);};
 const restore=(restored:JourneyState,message='Campaign restored.')=>{pilotMonitor.interrupt();setState(restored);setSaveBlocked(false);setPanel(null);setNotice(message);};
 const advance=()=>setState(current=>!current?null:current.chapter===1?continueToBactra(current):current.chapter===2?continueToPamirs(current):current.chapter===3?continueToKashgar(current):continueToDunhuang(current));
 const encounter=state?.status==='playing'?getEncounter(state):null;
 const person=state?.people.find(item=>item.id===panel);
 const skipTarget=state?.status!=='playing'?'debrief-title':state.lastOutcome?'outcome-title':'encounter-title';
 return <div className={preferences.largeText?'large-reading':''}>{notice&&<div className="notice" role="status"><span>{notice}</span>{loaded.raw&&saveBlocked&&<button onClick={()=>downloadText(loaded.raw!,'crossroads-original-recovery.json')}><Download size={16}/> Export original file</button>}<button className="icon-button" onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
 {!state?<Onboarding onStart={start} onImport={()=>setPanel('import')} onSettings={()=>open('settings')} onPilot={()=>setPanel('playtest')}/>:<div className="app-scene" style={{backgroundImage:`url(${journeyScene(state).src})`}}><a className="skip-link" href={`#${skipTarget}`} onClick={event=>{event.preventDefault();document.getElementById(skipTarget)?.focus();}}>Skip to decision</a><header className="game-header"><div className="brand"><strong>Crossroads</strong><span>The Silk Roads · Titans Forge</span></div><RouteStrip state={state}/><div className="header-actions"><span className="mode-label">{state.mode==='challenge'?'Caravan challenge':'Story journey'}</span><button className="journal-button" aria-label="Atlas & journal" onClick={()=>open('journal')}><Compass size={18}/><span>Atlas & journal</span></button><button className="icon-button" aria-label="Reading and controls" onClick={()=>open('settings')}><Settings size={18}/></button><button className="icon-button" aria-label="Start a new journey" onClick={()=>{setPendingMode(state.mode);setPanel('restart');}}><RotateCcw size={18}/></button></div></header>{pilot&&<div className="pilot-bar">{pilotMonitor.storageFailed&&<strong role="status">Playtest not saved — export before closing</strong>}<span>{pilot.phase==='playing'?pilot.paused?'Playtest paused':'Local playtest running':pilot.phase==='after'?'Playtest: closing questions ready':pilot.phase==='later'?'Playtest: follow-up available when you return':'Playtest complete'}</span>{pilot.phase==='playing'&&<button onClick={()=>setPilot({...pilot,paused:!pilot.paused})}>{pilot.paused?'Resume':'Pause'}</button>}<button onClick={()=>setPanel('playtest')}>{pilot.phase==='playing'?'Finish or export':'Open playtest record'}</button></div>}
 {state.status==='playing'?<main className="game" id="main-content"><TravelerRail people={state.people} speaker={encounter?.speaker} onSelect={selected=>setPanel(selected.id)}/><div className="game-center"><JourneyScene state={state} onEnlarge={()=>setPanel('landscape')} onAtlas={()=>open('journal')}/>{encounter&&(state.lastOutcome?<OutcomePanel outcome={state.lastOutcome} onContext={()=>open('context')} onContinue={()=>setState(current=>current?acknowledgeOutcome(current):null)}/>:<DecisionPanel encounter={encounter} state={state} disabled={panel!==null||(pilot?.phase==='playing'&&pilot.paused)} shortcuts={preferences.shortcuts} allEffects={preferences.allEffects} onToggleEffects={()=>setPreferences(value=>({...value,allEffects:!value.allEffects}))} onContext={()=>open('context')} onChoose={id=>{const next=choose(state,id);if(next.decisions.length>state.decisions.length){pilotMonitor.record(encounter.id,id);setState(next);}}}/>)}</div><ResourceRail state={state}/></main>:<div id="main-content"><Debrief state={state} onAnswer={id=>setState(current=>current?recordReflection(current,id):null)} onContinue={advance} onRestart={()=>{setPendingMode(state.mode);setPanel('restart');}} onJournal={()=>open('journal')}/></div>}</div>}
 <Suspense fallback={<div className="panel-loading" role="status">Opening panel…</div>}>
 {panel==='landscape'&&state&&<Modal title={journeyScene(state).label} onClose={close} wide><figure className="landscape-preview"><img src={journeyScene(state).src} alt={journeyScene(state).alt}/><figcaption>Illustrative reconstruction for the game. The scene combines regional features; it is not evidence of a specific place or journey around AD 200.</figcaption></figure></Modal>}
 {panel==='settings'&&<Modal title="Reading and controls" onClose={close}><ReadingControls value={preferences} onChange={setPreferences} onPilot={()=>setPanel('playtest')}/></Modal>}
 {panel==='playtest'&&<Modal title="Learner playtest" onClose={close}><PlaytestPanel pilot={pilot} game={state} rawRecovery={saveBlocked?loaded.raw:null} onChange={setPilot} onBegin={replaceJourney} onClose={close} storageFailed={pilotMonitor.storageFailed}/></Modal>}
 {panel==='journal'&&state&&<JourneyLedger state={state} onClose={close} onImport={restore}/>}
 {panel==='context'&&encounter&&<Modal title="Historical context" onClose={close}><div className="context-content"><BookOpen size={28}/><h3>{encounter.title}</h3><p>{encounter.sourceNote}</p>{encounter.sourceUrl&&<a href={encounter.sourceUrl} target="_blank" rel="noreferrer">{encounter.sourceLabel??'Read supporting source'}</a>}<div className="source-framing"><h4>Evidence and reconstruction</h4><p>{sourceFraming}</p></div></div></Modal>}
 {person&&<Modal title={person.name} onClose={close}><div className="person-profile"><span className="chapter-label">{person.role}</span><p>{person.reason}</p><p>{person.traveling?'Traveling with Samira':`Household contact in ${person.location}`}</p><dl><div><dt>Health</dt><dd>{person.health}/100</dd></div><div><dt>Trust</dt><dd>{person.trust}/100</dd></div></dl><p className="small-note">Health represents physical resilience. Trust represents confidence in the household's leadership. These are simplified game measures.</p></div></Modal>}
 {panel==='import'&&<Modal title="Restore a journey" onClose={close}><CampaignTransfer state={state} onImport={restore}/></Modal>}
 {panel==='restart'&&<Modal title="Begin another journey?" onClose={close}><p>This replaces the current autosave. Export a copy first if you want to return to this journey.</p>{state&&<CampaignTransfer state={state} onImport={restore}/>} {loaded.raw&&saveBlocked&&<button className="secondary" onClick={()=>downloadText(loaded.raw!,'crossroads-original-recovery.json')}><Download size={16}/> Export original file</button>}<label className="restart-mode">New experience <select value={pendingMode} onChange={event=>setPendingMode(event.target.value as GameMode)}><option value="story">Story journey</option><option value="challenge">Caravan challenge</option></select></label><div className="action-row"><button className="secondary" onClick={close}>Keep this journey</button><button className="primary" onClick={()=>{pilotMonitor.interrupt();replaceJourney(pendingMode);}}>Start and replace saved file</button></div></Modal>}
 </Suspense></div>;
}

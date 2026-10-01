import { Component, type ReactNode } from 'react';
import { SAVE_KEY } from '../game/storage';
import { downloadText } from './CampaignTransfer';
export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){if(!this.state.failed)return this.props.children;
    return <main className="recovery"><h1>The journey could not be displayed.</h1><p>Your saved file has been kept. Export it before reloading if you want a recovery copy.</p><div className="action-row"><button className="primary" onClick={()=>window.location.reload()}>Reload game</button><button className="secondary" onClick={()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(raw)downloadText(raw,'crossroads-recovery.json');}catch{/* Storage may be unavailable. */}}}>Export recovery file</button></div></main>;
  }
}

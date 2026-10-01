import { describe, expect, it } from 'vitest';
import { createImportReader } from '../src/game/importReader';
import { createInitialState } from '../src/game/engine';
import { serializeCampaign } from '../src/game/save';
import { MAX_SAVE_BYTES } from '../src/game/validation';

function deferred() {
  let resolve!: (text: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes,no) => { resolve=yes; reject=no; });
  return { file: { size: 10, text: () => promise }, resolve, reject };
}
const valid = serializeCampaign(createInitialState());

describe('campaign import selection ownership', () => {
  it('accepts a validated campaign without modifying it', async () => {
    expect(await createImportReader().read({size:valid.length,text:async()=>valid})).toMatchObject({ok:true,state:createInitialState()});
  });
  it('ignores an older success after a newer file is selected', async () => {
    const reader=createImportReader(), first=deferred(), second=deferred();
    const a=reader.read(first.file), b=reader.read(second.file);
    second.resolve(valid);
    expect(await b).toMatchObject({ok:true});
    first.resolve(valid);
    expect(await a).toBeNull();
  });
  it('ignores an older failure and keeps the newer result', async () => {
    const reader=createImportReader(), first=deferred();
    const a=reader.read(first.file);
    expect(await reader.read({size:3,text:async()=>'bad'})).toMatchObject({ok:false});
    first.reject(new Error('old read failed'));
    expect(await a).toBeNull();
  });
  it('cancels a pending read', async () => {
    const reader=createImportReader(), file=deferred();
    const pending=reader.read(file.file);
    reader.cancel();file.resolve(valid);
    expect(await pending).toBeNull();
  });
  it('rejects oversized files without reading them', async () => {
    let read=false;
    const result=await createImportReader().read({size:MAX_SAVE_BYTES+1,text:async()=>{read=true;return valid;}});
    expect(result).toMatchObject({ok:false});
    expect(read).toBe(false);
  });
  it('reports a current read failure without replacing the journey', async () => {
    expect(await createImportReader().read({size:10,text:async()=>{throw new Error('denied');}})).toMatchObject({ok:false,error:expect.stringContaining('unchanged')});
  });
});

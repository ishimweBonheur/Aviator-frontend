const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));
edit('src/services/api.ts',s=>s.replace('  started_at?: string;',`  betting_closes_at?: string;
  server_seed_hash: string;
  server_seed?: string;
  client_seed: string;
  nonce: number;
  house_edge?: string;
  started_at?: string;`).replace('  status: "ACTIVE";',`  status: "ACTIVE" | "CANCELLED" | "CASHED_OUT" | "LOST";
  round_number: number;
  round_status: ApiRound["status"];
  cashout_multiplier?: string;`).replace('    | "ROUND_OPENED"','    | "COUNTDOWN" | "BET_PLACED" | "BET_CANCELLED" | "BET_CASHED_OUT"\n    | "ROUND_OPENED"').replace('export interface RoundEvent {','export interface RoundEvent {\n seconds_remaining?: number;\n betting_closes_at?: string;\n timestamp?: string;').replace('request<ApiRound>("/api/game/rounds/current")','request<{running: ApiRound | null; upcoming: ApiRound | null; current_multiplier?: string; server_time:string}>("/api/game/rounds/current")').replace('`/api/bets/${betId}`','`/api/bets/${betId}/cashout`').replace('  health: () =>',`  cancel: (token:string,id:string) => request<{status:string}>("/api/bets/"+id+"/cancel",{method:"POST",token}),
  bets: (token:string) => request<ApiBet[]>("/api/bets",{token}),
  rounds: () => request<ApiRound[]>("/api/game/rounds"),
  fairness: (id:number) => request<ApiRound>("/api/game/rounds/"+id+"/fairness"),
  limits: () => request<{MinBet:string;MaxBet:string;MaxPayout:string}>("/api/limits"),
  health: () =>`));
edit('src/services/gameService.ts',s=>s.replace('cancelBet: (panel: number) => void;','cancelBet: (panel: number) => void | Promise<void>;').replace('  refresh?:','  accountRequest?: <T>(path:string,body?:unknown)=>Promise<T>;\n  refresh?:'));
edit('src/types/game.ts',s=>s.replace('  mode?:', '  limits?: {MinBet:string;MaxBet:string;MaxPayout:string};\n  mode?:'));
edit('src/services/backendGameService.ts',s=>s.replace('{ api, ApiError, websocketUrl }','{ api, ApiError, websocketUrl, request }').replace('  private state =','  private eventVersion = 0;\n  private refreshVersion = 0;\n  private state =').replace('        this.onEvent(event);','        this.eventVersion++;\n        this.onEvent(event);').replace(/  refresh = async \(\) => \{[\s\S]*?\n  private async refreshBalance/,`  refresh = async () => {
    const authVersion=this.authVersion, version=++this.refreshVersion, events=this.eventVersion;
    try {
      const [snapshot,rounds,limits]=await Promise.all([api.currentRound(),api.rounds(),api.limits()]);
      if(version!==this.refreshVersion)return;
      this.publish({history:rounds.map(r=>Number(r.crash_point)),limits});
      this.historyIds=new Set(rounds.map(r=>r.id));
      if(events===this.eventVersion){
        this.publish({bettingRound:undefined,countdown:0});
        if(snapshot.running){this.applyRound(snapshot.running);this.onEvent({type:"MULTIPLIER_UPDATE",round_id:snapshot.running.id,round_number:snapshot.running.round_number,multiplier:snapshot.current_multiplier})}
        else this.publish({round:{...this.state.round,status:"WAITING",multiplier:1}});
        if(snapshot.upcoming){
          const r=snapshot.upcoming;
          const seconds=r.betting_closes_at?Math.max(0,Math.ceil((Date.parse(r.betting_closes_at)-Date.parse(snapshot.server_time))/1000)):0;
          this.publish({bettingRound:{id:String(r.id),roundNumber:r.round_number},countdown:seconds});
        }
      }
      if(this.token && !this.state.pendingPanels?.length){
        const bets=await api.bets(this.token);
        if(authVersion===this.authVersion && version===this.refreshVersion && !this.state.pendingPanels?.length){
          this.publish({bets:bets.map(b=>({id:String(b.id),roundId:String(b.round_id),roundNumber:b.round_number,userId:String(b.user_id),panel:b.bet_number-1,amount:Number(b.amount),status:b.status==="ACTIVE" && ["BETTING_OPEN","BETTING_CLOSED"].includes(b.round_status)?"PENDING":b.status,cashOutMultiplier:b.cashout_multiplier?Number(b.cashout_multiplier):undefined,potentialWin:b.status==="CASHED_OUT"?Number(b.payout):b.status==="ACTIVE"?Number(b.amount)*(b.round_id===Number(this.state.round.id)?this.state.round.multiplier:1):0}))});
          this.persist();
        }
      }
    } catch(error){
      if(error instanceof ApiError && error.status===401 && authVersion===this.authVersion)this.expireSession();
      else this.publish({error:(error as Error).message});
    }
    if(this.token && authVersion===this.authVersion)await this.refreshBalance();
  };
  private async refreshBalance`).replace('  private onEvent(event: RoundEvent) {',`  private onEvent(event: RoundEvent) {
    if(event.type.startsWith("BET_")){if(this.token)void this.refresh();return;}
    if(event.type==="COUNTDOWN"){
      if(event.round_id>=this.lastClosedRound)this.publish({bettingRound:{id:String(event.round_id),roundNumber:event.round_number},countdown:event.seconds_remaining??0});
      return;
    }`).replace('    await this.refreshBalance();\n    if (!this.state.user)','    await this.refresh();\n    if (!this.state.user)').replace('amount < 50 ||','amount < Number(this.state.limits?.MinBet??50) ||').replace('amount > 1000000 ||','amount > Number(this.state.limits?.MaxBet??1000000) ||').replace('if (this.state.connection !== "connected" || !target)','if (this.state.connection !== "connected" || !target || this.state.countdown<=0)').replace(/  cancelBet = \(\) => \{[\s\S]*?\n  addDemoFunds =/,`  cancelBet = async (panel:number) => {
    const bet=this.state.bets.find(b=>b.panel===panel && b.roundId===this.state.bettingRound?.id && b.status==="PENDING");
    if(!bet || this.state.countdown<=0 || this.state.pendingPanels?.includes(panel))throw new Error("No cancellable bet");
    const version=this.authVersion;
    this.publish({pendingPanels:[...this.state.pendingPanels!,panel]});
    try{await api.cancel(this.token,bet.id)}finally{
      if(version===this.authVersion){this.publish({pendingPanels:this.state.pendingPanels!.filter(p=>p!==panel)});await this.refresh();}
    }
  };
  accountRequest = async <T,>(path:string,body?:unknown):Promise<T> => {
    const version=this.authVersion;
    try{return await request<T>(path,{token:this.token,body,method:body===undefined?"GET":"POST"})}
    catch(error){if(error instanceof ApiError && error.status===401 && version===this.authVersion)this.expireSession();throw error}
    finally{if(body!==undefined && version===this.authVersion)await this.refresh()}
  };
  addDemoFunds =`).replace('"The backend has no deposit endpoint"','"Use the SANDBOX deposit form"').replace('the backend has no bet lookup endpoint yet.','refresh to reconcile the persisted bet.').replace('Wallet refresh can verify balance, but a bet-status endpoint is still needed.','Refresh to reconcile the persisted bet.').replaceAll('        this.persist();\n      }\n    }\n  };','        this.persist();\n        await this.refresh();\n      }\n    }\n  };'));
edit('src/components/BetPanel.tsx',s=>s.replace('    ? !!game.bettingRound &&','    ? game.countdown > 0 && !!game.bettingRound &&').replace('gameService.cancelBet(panel);','await gameService.cancelBet(panel);').replace('toast("Bet cancelled. Demo funds returned.");','toast("Bet cancelled. Funds refunded.");').replace('? "Bet placed"','? "Cancel bet"').replace('(game.connection !== "connected" || bet?.status === "PENDING")','(game.connection !== "connected" || (bet?.status === "PENDING" && !open))').replace('            bet?.status === "LOST" ||','            bet?.status === "LOST" || bet?.status === "CANCELLED" ||').replace('                    : open','                    : bet?.status === "CANCELLED" ? "Cancelled" : open').replace('Cancellation is not available.','Cancel before betting closes.').replace('min={backend ? 50 : 100}','min={backend ? Number(game.limits?.MinBet??50) : 100}').replace('max="1000000"','max={Number(game.limits?.MaxBet??1000000)}'));
edit('src/components/GameCanvas.tsx',s=>s.replace('{backend ? "—" : countdown}','{countdown}').replace('{!backend && <span>s</span>}','{<span>s</span>}'));
edit('src/components/BackendAccount.tsx',s=>s.replace('import { useState }','import { WalletActivity } from "./WalletActivity";\nimport { useState }').replace(/        \{wallet && \([\s\S]*?\n        \)\}/,'        {wallet && <WalletActivity />}').replace('Only bets acknowledged in this browser session can be displayed.\n          Account-wide bet history is not available yet.','Your bets and wallet history are loaded from your account.'));
edit('src/App.tsx',s=>s.replace('import { BackendAccount }','import { FairnessView } from "./components/FairnessView";\nimport { BackendAccount }').replace('Payments are not implemented.','SANDBOX deposits are for local testing; external payments remain pending.').replace('Cancellation and automatic cash-out are not implemented yet.','Cancel during betting; cash out during flight. Automatic cash-out is not implemented.').replace('{modal === "history" && (','{modal === "history" && backend && <FairnessView />}\n              {modal === "history" && !backend && ('));
edit('src/components/IntegrationStatus.tsx',s=>s.replace('bet, cash out, round lookup, and five WebSocket round events.','bet, cancellation, cash out, funding, history, fairness and realtime events.').replace('Cancel bet, server auto cash-out, bet\n          lookup/history, public player feed, round history, deposits,\n          withdrawals, and transaction history.','Real external payments and server auto cash-out.').replace('Session only','Persistent history').replace('Recent crashes and your acknowledged\n          bets.','Recent completed rounds and your account bets.'));

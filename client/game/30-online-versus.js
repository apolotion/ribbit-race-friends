    // The online setup is rendered by the SAME canvas/Versus UI as local play.
    // Network responses never drive requestAnimationFrame or the local charge meter.
    const OnlineVersus = (() => {
      const RELAY = Object.freeze({protocol:3,lobbyPollMs:220,gameplayPollMs:75,
        retryPollMs:350,snapshotMs:75,staleMs:4500,disconnectMs:30000,maxPredictionMs:2500});
      const state = {
        role:null,authorityRole:'host',authorityVersion:1,cpuIndex:-1,exitMenu:false,exitFocus:'continue',takeoverNoticeUntil:0,takeoverReason:'',lastRecoverySnapshot:null,roomCode:'',playerToken:'',connected:false,active:false,screen:'closed',quickplay:false,
        codeText:'',codeFocused:false,focus:'host',busy:false,error:false,message:'',
        localReady:false,remoteReady:false,remoteConnected:false,remoteName:'WAITING',localName:'PLAYER',localNameShort:'PLAYER',remoteNameShort:'WAITING',
        localSkinId:'azure',remoteSkinId:'crimson',localAppearance:null,remoteAppearance:null,
        lobbyRevision:1,settingsRevision:1,readyForSettings:0,settingsEditing:false,lobbyEpoch:1,
        settings:null,requestSequence:0,requestInFlight:false,pollTimer:null,pollDueAt:0,
        urgent:false,generation:0,startTimer:null,lastSuccessfulExchangeAt:0,
        requestStartedAt:0,rttMs:0,serverMs:0,lastSnapshotAt:0,lastSnapshotSequence:0,snapshotSequence:0,
        inputSequence:0,pendingInputEvents:[],unacknowledgedInputs:[],acknowledgedGuestInputSequence:0,
        startSequenceSeen:0,nextRoundSequenceSeen:0,resultMatchId:'',resultRecorded:false,resultSeenMatchId:'',
        pendingNextRoundCommand:null,pendingReturnLobbyCommandId:'',heldControls:new Set(),remoteHeld:false,
        previousSetup:null,previousVocabulary:null,localChargeStartedAt:0,
        resultRetryTimer:null,resultRequest:null,connectionPaused:false,starting:false,
        receivedSnapshotCount:0,renderCorrections:[{x:0,y:0},{x:0,y:0}],lastLobbySentAt:0,
        lastScores:[0,0],lastSettingsFingerprint:'',localSettingsFingerprint:'',awaitingHostFrame:false
      };
      const GAME_FIELDS = [
        'state','mode','score','elapsed','finishTime','worldTime','selectedLevelId','timeOfDay','moonPhaseIndex',
        'countdownNumber','countdownTimer','targetVocabIndex','promptSerial','pvpWinnerIndex','pvpWinPendingIndex',
        'pvpElapsed','pvpFinalDisplayTime','pvpRoundWins','pvpRoundNumber','pvpMatchWinnerIndex','pvpBonusEligible',
        'pvpFirstTo','pvpBestOf','pvpRoundGoalMode','pvpTimeLimitSeconds','pvpTimeRemaining','pvpTimedOutcomePending',
        'pvpTimerGraceActive','pvpTimerGraceEligible','pvpSuddenDeath','pvpSuddenDeathScores','pvpCelebrationTimer',
        'pvpCelebrationWinnerIndex','pvpTimeExpiredAt','winInputLock','pvpCriticalCatchActive','pvpCriticalCatchElapsed',
        'pvpCriticalCatchDuration','pvpCriticalCatchX','pvpCriticalCatchY','pvpCriticalCatchWinnerIndex',
        'pvpSuddenDeathAlertTimer','quickplayNextRoundAt','pvpCriticalCatchEventId','pvpCriticalCatchPlayedThisRound'
      ];
      const MOTION_FIELDS=['x','y','vx','vy','dir','grounded','charging','charge','chargeDirection','chargeHoldTime',
        'inputHeld','chargeFacingDir','firstJumpMade','airTime','jumpStartY','highestY','lastLaunchPower',
        'departurePlatform','dropThroughPlatform','platformDropBufferUntil','airborneTapPressAt','landingSquash',
        'quickDropThisJump','lastStreakPower','streakTimer','streakDuration','streakSpawnClock'];
      // Protocol 3 control-plane compatibility is preserved. A non-relay peer
      // channel is REQUIRED before Ready, Quickplay acceptance or live gameplay.
      // A pre-queue candidate check is not proof of reachability to a future peer.
      const DIRECT_PEER_ENABLED = true;
      const net = {
        serverOffset:0,clockKnown:false,peer:null,channel:null,signal:null,seenSignal:'',peerBusy:false,
        peerAttempted:false,peerAt:0,peerRtt:0,lastPing:0,lastDirectSnapshot:0,peerError:'',epoch:'',
        simClock:0,roundKey:'',launchSequence:0,launches:[],history:[],historyAt:-1,
        remoteSamples:[],remoteLaunches:[],remotePlayed:0,remotePlay:null,remoteDisplay:null,
        promptPlan:[],claimSequence:0,pendingClaims:[],predictedCatches:[],claimAck:0,
        receipts:[],catches:[],flights:new Map(),guestTrace:[],lastGuestTraceAt:-1,
        localFlightSequence:0,localFlightStarted:0,localActionAt:0,remoteBuffer:new Map(),
        processingInput:false,replaying:false,correctionMessageUntil:0,lastAuth:null,
        worker:null,fallbackTimer:null,predictionHold:false,finalSpeculated:false,finalVisualElapsed:0,diagnosticClaims:{accepted:0,rejected:0}
      };
      function serverNow(){return net.clockKnown?now()+net.serverOffset:Date.now();}
      function learnClock(r,rtt){
        if(state.role==='guest'&&net.peerClockKnown)return;
        if(!Number.isFinite(Number(r.serverTime)))return;
        const target=Number(r.serverTime)+Math.max(0,rtt)/2-now();
        if(!net.clockKnown){net.serverOffset=target;net.clockKnown=true;net.bestClockRtt=rtt;return;}
        if(!Number.isFinite(net.bestClockRtt)||rtt<net.bestClockRtt*1.2){
          net.bestClockRtt=Math.min(net.bestClockRtt||Infinity,rtt);
          net.serverOffset=lerp(net.serverOffset,target,.15);
        }
      }
      // Friends Edition: authenticated WebSockets via Cloudflare, not WebRTC or Google polling.
      // Legacy internal names remain so the established game/prediction/lifecycle code is unchanged.
      const DIRECT=Object.freeze({version:2,connectMs:30000,reconnectMs:35000,pingMs:500,staleMs:6000,controlMs:1200});
      const gate={preflightId:0,cancelPreflight:null,preflight:null,pairAt:0,phase:'idle',failure:'',lastAttempt:null,timer:null,
        everVerified:false,ending:false,expectedDeparture:false,departureAt:0,finishedOffline:false,pairId:'',localChallenge:'',
        serverVerified:false,serverVersion:0,lossAt:0,offerAttempt:0,retries:0,lastRetryAt:0};
      function cancelDirectPreflight(){gate.preflightId++;gate.cancelPreflight?.();gate.cancelPreflight=null;}
      async function checkLocalDirectCapability(){
        cancelDirectPreflight();const id=gate.preflightId,controller=new AbortController();gate.cancelPreflight=()=>controller.abort();
        const timer=setTimeout(()=>controller.abort(),8000);
        try{
          if(typeof WebSocket!=='function'||navigator.onLine===false)throw new Error('THIS DEVICE IS OFFLINE OR DOES NOT SUPPORT WEBSOCKETS.');
          const r=await fetch('/api/health',{cache:'no-store',signal:controller.signal}),j=await r.json();
          if(!r.ok||j.friendsVersion!==1)throw new Error('OPEN THE DEPLOYED FRIENDS EDITION LINK.');
          if(id!==gate.preflightId)throw Object.assign(new Error('CANCELLED'),{code:'DIRECT_CANCELLED'});
          gate.preflight={ok:true,checkedAt:Date.now(),message:'SERVER REACHABLE; PAIR SOCKET CHECK FOLLOWS'};return true;
        }catch(e){gate.preflight={ok:false,checkedAt:Date.now(),message:e.message};
          if(id!==gate.preflightId)throw Object.assign(e,{code:'DIRECT_CANCELLED'});
          throw Object.assign(new Error(e.name==='AbortError'?'CLOUDFLARE COULD NOT BE REACHED. CHECK YOUR CONNECTION.':e.message),{code:'DIRECT_UNAVAILABLE'});
        }finally{clearTimeout(timer);if(id===gate.preflightId)gate.cancelPreflight=null;}
      }
      function resetPeerVerification(){
        net.peerNonce=commandId('socket');net.remotePeerNonce='';net.remoteChallenge='';net.peerHello=false;
        net.localVerified=false;net.peerVerified=false;net.peerClockKnown=false;net.bestPeerClockRtt=Infinity;
        net.pathVerified=false;net.pathTypes={local:'cloudflare',remote:'cloudflare'};
        net.pings=new Map();net.pingReplies=0;net.lastPongAt=0;net.lastHelloAt=-Infinity;net.lastVerifiedAt=-Infinity;net.lastPing=-Infinity;
        net.lastDirectRetry=-Infinity;net.peerRtt=0;net.lastServerPong=0;
      }
      function directReady(){
        return !!(state.connected&&net.socket?.readyState===WebSocket.OPEN&&net.peerHello&&net.peerVerified&&net.localVerified&&
          net.pingReplies>=2&&now()-net.lastPongAt<DIRECT.staleMs);
      }
      function closePeer(){
        const ws=net.socket;net.socket=null;net.peer=null;net.channel=null;net.fastChannel=null;net.signal=null;net.peerBusy=false;
        net.peerAttempted=false;resetPeerVerification();
        if(ws){ws.onopen=ws.onmessage=ws.onclose=ws.onerror=null;try{ws.close(1000,'Room closed');}catch(_){}}
      }
      function directStatus(){
        if(state.cpuIndex>=0)return 'LOCAL CPU LV 5';
        if(gate.finishedOffline)return 'SERVER CONNECTION ENDED';
        if(gate.lossAt)return 'RECONNECTING - '+Math.max(0,Math.ceil((DIRECT.reconnectMs-(now()-gate.lossAt))/1000))+' SEC';
        if(directReady())return 'SERVER CONNECTED - '+Math.round(net.peerRtt)+' MS';
        if(!state.remoteConnected)return 'SHARE YOUR ROOM CODE WITH A FRIEND';
        return net.socket?.readyState===1?'VERIFYING BOTH PLAYERS':'CONNECTING TO CLOUDFLARE';
      }
      function failDirect(message){
        if(gate.ending)return;
        if(state.active&&game.pvpMatchWinnerIndex!==null&&gate.everVerified){gate.finishedOffline=true;gate.phase='finished';closePeer();return;}
        gate.ending=true;const attempt=gate.lastAttempt||{kind:state.quickplay?'quick':'host'};
        if(state.connected)sendDirectAbort({roomCode:state.roomCode,playerToken:state.playerToken,pairId:gate.pairId});
        cleanup(false);open();gate.lastAttempt=attempt;gate.failure=String(message||'SERVER CONNECTION UNAVAILABLE');
        gate.phase='blocked';gate.ending=false;state.screen='directBlocked';state.focus='directRetry';game.state='onlineConnect';state.busy=false;
      }
      function directFailureAction(id){
        if(id==='directLocal'){
          // Failed Online/Quickplay should return to the Single Player level menu.
          // Do not restore a queued/background activity or auto-start the Park stage.
          cleanup(false);quick.suspendedActivity=null;quick.peekActivity=null;openSoloMenu(false);return;
        }
        if(id==='directOnline'){state.screen='entry';state.focus='quick';setStatus('');return;}
        const a=gate.lastAttempt||{kind:'quick'};gate.failure='';state.screen='entry';
        if(a.kind==='quick')openQuickplay();else if(a.kind==='join'){showJoin();state.codeText=a.code||'';joinRoom();}else createRoom();
      }
      function drawDirectBlocked(){
        drawPanel('CONNECTION HELP');fitText('THE CLOUD CONNECTION COULD NOT CONTINUE',240,75,376,.8,'#96334c');
        fitText(gate.failure,240,103,376,.64,'#96334c');fitText('CHECK YOUR INTERNET AND REFRESH BOTH PAGES.',240,133,376,.66);
        fitText('SINGLE PLAYER / LOCAL VERSUS ARE STILL AVAILABLE.',240,158,376,.64,'#07516a');
        for(const b of onlineButtons())drawOnlineAction(b,state.focus===b.id);
      }
      function noteDirectLoss(reason){
        if(!state.connected||state.cpuIndex>=0||gate.finishedOffline)return;
        net.peerError=reason||'SERVER CONNECTION INTERRUPTED';
        if(!gate.everVerified)return;
        if(state.active&&game.pvpMatchWinnerIndex!==null){gate.finishedOffline=true;gate.phase='finished';return;}
        if(!gate.lossAt){gate.lossAt=now()||.001;releaseHeldControl();scheduleExchange(0);}
        gate.phase='reconnecting';
      }
      async function sendDirectAbort(req,attempt=0){
        try{const r=await RibbitCloud.abortDirectRoom(req);if(!r?.ok&&attempt<2)setTimeout(()=>sendDirectAbort(req,attempt+1),800);}
        catch(_){if(attempt<2)setTimeout(()=>sendDirectAbort(req,attempt+1),1000);}
      }
      function directProofPacket(){return {pairId:gate.pairId,nonce:net.peerNonce,peerNonce:net.remotePeerNonce,peerChallenge:net.remoteChallenge||''};}
      function updateDirectPolicy(p){
        if(p?.version!==2||!p.pairId||!p.challenge){failDirect('DEPLOY THE MATCHING FRIENDS SERVER AND REFRESH.');return false;}
        if(gate.pairId&&gate.pairId!==p.pairId){closePeer();gate.everVerified=false;gate.pairAt=gate.lossAt=0;state.localReady=false;
          state.readyForSettings=0;state.lobbyRevision++;if(state.active)returnToLobbyLocal();}
        gate.pairId=p.pairId;gate.localChallenge=p.challenge;gate.serverVerified=p.verified===true;gate.serverVersion=p.version;return true;
      }
      function updateDirectVerification(){
        net.localVerified=!!(net.peerHello&&net.pingReplies>=2&&now()-net.lastPongAt<DIRECT.staleMs);
        if(!directReady())return;
        const first=!gate.everVerified,recovered=!!gate.lossAt;
        gate.everVerified=true;gate.phase='verified';gate.lossAt=0;gate.expectedDeparture=false;
        if(first||recovered){lastFrameTime=now();accumulator=0;setStatus('CONNECTED THROUGH CLOUDFLARE');scheduleExchange(0);}
        if(state.quickplay&&!state.active&&!state.localReady){state.localReady=true;state.readyForSettings=state.settingsRevision;
          state.lobbyRevision++;quick.message='CONNECTED - LOADING BOTH PLAYERS';scheduleExchange(0);}
        if(state.pendingStartConfig&&!state.active)beginMatch(state.pendingStartConfig);
      }
      function captureDirectSnapshot(){
        const s=captureSnapshot();s.motionHistory=[];s.launches=[];s.confirmedCatches=s.confirmedCatches.slice(-24);s.claimReceipts=s.claimReceipts.slice(-24);return s;
      }
      function sendPeer(type,data){
        const ws=net.socket,snapshot=type==='snapshot';
        if(!ws||ws.readyState!==1||ws.bufferedAmount>(snapshot?32000:128000)){if(snapshot)net.droppedSnapshots=(net.droppedSnapshots||0)+1;return false;}
        if(!['hello','ping','pong','direct-verified','direct-abort','leaving'].includes(type)&&!directReady())return false;
        try{const msg=JSON.stringify({protocol:3,room:state.roomCode,epoch:net.epoch,pairId:gate.pairId,type,data});
          if(new TextEncoder().encode(msg).length>65536)return false;ws.send(msg);return true;}catch(_){return false;}
      }
      function receivePeerSignal(){/* Friends Edition has no WebRTC signaling. */}
      async function maybeStartPeer(){
        if(!state.connected||state.cpuIndex>=0||gate.finishedOffline||!gate.pairId||net.socket||net.peerBusy)return;
        if(now()-(net.socketAttemptAt||-10000)<1500)return;
        net.socketAttemptAt=now();net.peerBusy=true;const generation=state.generation;
        try{
          // The URL contains a room capability, never an account private key. The HttpOnly cookie is also required.
          const url=new URL('/ws',location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:';
          url.searchParams.set('roomCode',state.roomCode);url.searchParams.set('playerToken',state.playerToken);
          const ws=new WebSocket(url);net.socket=ws;resetPeerVerification();
          net.peer={connectionState:'connecting'};gate.offerAttempt++;
          ws.onopen=()=>{if(net.socket!==ws||state.generation!==generation)return;
            net.peer.connectionState='connected';net.peerBusy=false;net.lastHelloAt=-Infinity;gate.phase='verifying';tickDirectConnection();};
          ws.onclose=()=>{if(net.socket!==ws)return;net.socket=null;net.peer=null;net.peerBusy=false;noteDirectLoss('CLOUDFLARE SOCKET CLOSED');};
          ws.onerror=()=>{if(net.socket===ws){net.peerBusy=false;net.peerError='WEBSOCKET CONNECTION FAILED';}};
          ws.onmessage=e=>{
            if(net.socket!==ws||state.generation!==generation||!state.connected||typeof e.data!=='string'||e.data.length>70000)return;
            let msg;try{msg=JSON.parse(e.data);}catch(_){return;}
            if(msg.type==='server-presence'){
              if(!msg.partnerConnected&&gate.everVerified)noteDirectLoss('PARTNER IS RECONNECTING');
              if(msg.partnerConnected){net.lastHelloAt=-Infinity;tickDirectConnection();}return;
            }
            if(msg.type==='server-pong'){net.lastServerPong=now();return;}
            if(msg.type==='server-error'){net.peerError=String(msg.message||'SERVER CONNECTION ERROR');return;}
            if(msg.type==='server-policy'){scheduleExchange(0);return;}
            if(msg.room!==state.roomCode||msg.epoch!==net.epoch||msg.pairId!==gate.pairId)return;
            const d=msg.data;net.peerAt=now();
            // Acknowledge delivery even during menus/start transitions, allowing the server to keep only the newest pending state.
            if(msg.type==='snapshot'){try{ws.send(JSON.stringify({type:'wire-ack',sequence:d?.sequence}));}catch(_){}}
            if(msg.type==='hello'){
              if(d?.policy!==2||d.role===state.role||!['host','guest'].includes(d.role)||typeof d.nonce!=='string'||typeof d.challenge!=='string')return;
              if(net.remotePeerNonce&&net.remotePeerNonce!==d.nonce){net.peerVerified=false;net.localVerified=false;net.pingReplies=0;net.pings.clear();}
              net.peerHello=true;net.remotePeerNonce=d.nonce;net.remoteChallenge=d.challenge;updateDirectVerification();return;
            }
            if(msg.type==='ping'){sendPeer('pong',{id:d?.id,serverAt:serverNow()});return;}
            if(msg.type==='pong'){
              const sent=net.pings.get(d?.id);if(sent===undefined)return;
              net.pings.delete(d.id);net.peerRtt=Math.max(0,now()-sent);net.lastPongAt=now();net.pingReplies++;
              if(state.role==='guest'&&Number.isFinite(d.serverAt)&&net.peerRtt<=net.bestPeerClockRtt*1.5){
                const target=d.serverAt+net.peerRtt/2-now();net.serverOffset=net.peerClockKnown?lerp(net.serverOffset,target,.15):target;
                net.peerClockKnown=true;net.clockKnown=true;net.bestPeerClockRtt=Math.min(net.bestPeerClockRtt,net.peerRtt);}
              updateDirectVerification();return;
            }
            if(msg.type==='direct-verified'){if(d?.nonce===net.remotePeerNonce&&d.peer===net.peerNonce){net.peerVerified=d.verified===true;updateDirectVerification();}return;}
            if(msg.type==='leaving'){gate.expectedDeparture=true;gate.departureAt=now();noteDirectLoss('PARTNER LEFT');scheduleExchange(0);return;}
            if(msg.type==='direct-abort'){failDirect('YOUR PARTNER ENDED THE CONNECTION.');return;}
            if(!directReady())return;
            if(msg.type==='snapshot'&&!isAuthority()&&state.active){applySnapshot(d,{snapshotAgeMs:0,direct:true});return;}
            if(msg.type==='inputs'&&isAuthority()&&state.active){receiveInputs(Array.isArray(d)?d:[]);sendPeer('snapshot',captureDirectSnapshot());return;}
            if(msg.type==='claims'&&isAuthority()&&state.active){receiveClaims(Array.isArray(d)?d:[]);sendPeer('snapshot',captureDirectSnapshot());return;}
            if(msg.type==='result'&&d?.matchId===state.resultMatchId)handleResult(d);
          };
        }catch(e){net.peerBusy=false;net.socket=null;net.peerError=String(e.message||e);}
      }
      function checkDirectHealth(){
        if(!state.connected||state.cpuIndex>=0||gate.finishedOffline)return true;
        if(gate.everVerified&&!directReady())noteDirectLoss('RECONNECTING');
        return !state.active||directReady();
      }
      function tickDirectConnection(){
        if(!state.connected||state.cpuIndex>=0||gate.finishedOffline)return;
        const t=now();checkDirectHealth();
        if(state.remoteConnected&&!gate.pairAt)gate.pairAt=t||.001;
        if(gate.lossAt&&t-gate.lossAt>DIRECT.reconnectMs){failDirect('THE CONNECTION COULD NOT BE RESTORED.');return;}
        if(gate.pairAt&&!gate.everVerified&&t-gate.pairAt>DIRECT.connectMs){failDirect('BOTH PLAYERS COULD NOT CONNECT. REFRESH AND TRY AGAIN.');return;}
        maybeStartPeer();
        if(net.socket?.readyState!==1)return;
        if(t-net.lastHelloAt>700){net.lastHelloAt=t;sendPeer('hello',{role:state.role,policy:2,nonce:net.peerNonce,challenge:gate.localChallenge});}
        if(t-net.lastPing>DIRECT.pingMs){net.lastPing=t;const id=commandId('ping');net.pings.set(id,t);for(const[k,v]of net.pings)if(t-v>6000)net.pings.delete(k);
          sendPeer('ping',{id});try{net.socket.send(JSON.stringify({type:'server-ping'}));}catch(_){}}
        updateDirectVerification();
        if(net.peerHello&&t-net.lastVerifiedAt>350){net.lastVerifiedAt=t;sendPeer('direct-verified',{policy:2,nonce:net.peerNonce,peer:net.remotePeerNonce,verified:net.localVerified});}
        if(directReady()&&state.active&&!isAuthority()&&t-net.lastDirectRetry>140){net.lastDirectRetry=t;
          if(state.unacknowledgedInputs.length)sendPeer('inputs',state.unacknowledgedInputs.slice(0,32));
          const c=net.pendingClaims.filter(c=>c.sequence>(net.directClaimAck||0)).slice(0,24);if(c.length)sendPeer('claims',c);}
        if(net.lastServerPong&&t-net.lastServerPong>7000){closePeer();noteDirectLoss('RECONNECTING TO CLOUDFLARE');}
      }

      function pumpTransport(){
        tickQuickplay();tickDirectConnection();captureReplayTick();
        if(watch.active&&!watch.inFlight&&now()>=watch.nextPollAt)pollSpectator();
        if(!state.connected)return;
        const t=now();
        if(state.active&&isAuthority()&&directReady()&&t-net.lastDirectSnapshot>=33){
          net.lastDirectSnapshot=t;sendPeer('snapshot',captureDirectSnapshot());
        }
        if(state.connected&&!state.requestInFlight&&!state.pollTimer)
          scheduleExchange(state.active&&syncClock.complete?DIRECT.controlMs:RELAY.lobbyPollMs);
      }
      function currentRoundKey(){return state.resultMatchId+':'+game.pvpRoundNumber+':'+(game.pvpSuddenDeath?'sd':'normal');}
      function resetRoundNetwork(key=currentRoundKey()){
        net.roundKey=key;net.simClock=0;net.launchSequence=0;net.launches=[];net.history=[];net.historyAt=-1;
        net.remoteSamples=[];net.remoteLaunches=[];net.remotePlayed=0;net.remotePlay=null;net.remoteDisplay=null;
        net.promptPlan=[];net.predictedCatches=[];net.receipts=[];net.catches=[];net.flights.clear();net.guestTrace=[];net.lastGuestTraceAt=-1;
        net.localFlightSequence=0;net.localFlightAge=0;net.localFlightStarted=now();net.lastAuth=null;net.predictionHold=false;net.finalSpeculated=false;net.finalVisualElapsed=0;
        resetRoundLifecycle(key);
      }
      function resetNetworkSession(epoch){
        closePeer();net.epoch=String(epoch||'');net.serverOffset=0;net.clockKnown=false;
        gate.pairAt=0;gate.phase='waiting';gate.everVerified=false;gate.expectedDeparture=false;
        gate.pairId='';gate.localChallenge='';gate.serverVerified=false;gate.lossAt=0;gate.offerAttempt=0;gate.retries=0;gate.lastRetryAt=0;
        gate.departureAt=0;gate.finishedOffline=false;net.directClaimAck=0;net.auditClaimAck=0;
        net.claimSequence=0;net.pendingClaims=[];net.claimAck=0;net.remoteBuffer.clear();net.diagnosticClaims={accepted:0,rejected:0};
        net.roundKey='';resetRoundNetwork('');
      }
      function planHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
      function preparePromptPlan(){
        if(!isHostActive())return;
        const key=currentRoundKey();if(key!==net.roundKey)resetRoundNetwork(key);
        const serial=Math.max(1,Number(game.promptSerial)||1);
        if(Number.isInteger(game.targetVocabIndex))net.promptPlan[serial]=game.targetVocabIndex;
        const reserved=getLiveOrQueuedVocabularyIndices(true);
        const used=new Set([...game.completedVocabIndices]);
        if(Number.isInteger(game.targetVocabIndex))used.add(game.targetVocabIndex);
        for(let n=serial+1;n<=serial+16;n++){
          if(Number.isInteger(net.promptPlan[n])){used.add(net.promptPlan[n]);continue;}
          let candidates=reserved.filter(i=>!used.has(i));
          if(!candidates.length)candidates=VOCABULARY.map((_,i)=>i).filter(i=>!used.has(i));
          if(!candidates.length){used.clear();candidates=VOCABULARY.map((_,i)=>i).filter(i=>i!==net.promptPlan[n-1]);}
          if(!candidates.length)candidates=[0];
          const v=candidates[planHash(key+':'+n)%candidates.length];net.promptPlan[n]=v;used.add(v);
        }
      }
      function plannedTarget(serial){return Number.isInteger(net.promptPlan[serial])?net.promptPlan[serial]:null;}
      function choosePlannedTarget(){
        if(!isHostActive())return false;
        // chooseNextVocabularyTarget has already incremented promptSerial.
        let v=plannedTarget(game.promptSerial);
        if(v===null){preparePromptPlan();v=plannedTarget(game.promptSerial);}
        const liveTargets=getLiveOrQueuedVocabularyIndices(false);
        if(liveTargets.length&&!liveTargets.includes(v)){
          let choices=liveTargets.filter(index=>!game.completedVocabIndices.has(index));
          if(!choices.length)choices=liveTargets.slice();
          v=choices[planHash(currentRoundKey()+':live:'+game.promptSerial)%choices.length];
          net.promptPlan[game.promptSerial]=v;
        }
        if(v===null)return false;
        game.targetVocabIndex=v;ensureTargetVocabularyAvailable(v);return true;
      }
      function motionSample(p,t){
        const z=p.tongue||{};
        return [Math.round(t*1000),p.x,p.y,p.vx,p.vy,p.dir,p.grounded?1:0,p.charging?1:0,p.charge,
          p.onlineLaunchSequence||0,p.bonked?1:0,p.stunTimer||0,p.catchSparkleTimer||0,
          z.active?1:0,z.elapsed||0,z.duration||.24,z.targetX||0,z.targetY||0,z.captured?1:0,p.landingSquash||0].map(v=>Math.round((Number(v)||0)*1000)/1000);
      }
      function rememberLaunch(p){
        if(!state.active||p.grounded||net.replaying)return;
        const key=currentRoundKey();if(key!==net.roundKey)resetRoundNetwork(key);
        if(isHostActive()&&p.index===0){
          p.onlineLaunchSequence=++net.launchSequence;
          const sample=motionSample(p,net.simClock);net.launches.push({sequence:net.launchSequence,t:sample[0],sample});
          net.launches=net.launches.slice(-10);net.history.push(sample);state.urgent=true;
          if(directReady())sendPeer('snapshot',captureDirectSnapshot());else scheduleExchange(0);
        }
      }
      function afterSimulationStep(dt){
        if(!state.active||!checkDirectHealth())return;
        const key=currentRoundKey();if(key!==net.roundKey)resetRoundNetwork(key);
        net.simClock+=dt;criticalProgress();
        if(isHostActive()){
          if(net.simClock-net.historyAt>=1/30){net.historyAt=net.simClock;net.history.push(motionSample(pvpPlayers[0],net.simClock));
            const edge=net.simClock*1000-6500;while(net.history.length&&net.history[0][0]<edge)net.history.shift();}
          if(net.simClock-net.lastGuestTraceAt>=1/30){net.lastGuestTraceAt=net.simClock;const p=pvpPlayers[1];
            net.guestTrace.push({at:serverNow(),x:p.x,y:p.y,dir:p.dir,bonked:p.bonked,stun:p.stunTimer});
            while(net.guestTrace.length>210)net.guestTrace.shift();}
        }
      }
      function mergeRemoteHistory(s){
        if(!Array.isArray(s.motionHistory))return;
        const times=new Map(net.remoteSamples.map(a=>[a[0],a]));
        for(const a of s.motionHistory)if(Array.isArray(a)&&a.length>=12&&a.every(Number.isFinite))times.set(a[0],a);
        net.remoteSamples=[...times.values()].sort((a,b)=>a[0]-b[0]).slice(-240);
        const seen=new Set(net.remoteLaunches.map(e=>e.sequence));
        for(const e of s.launches||[])if(e&&Number.isInteger(e.sequence)&&e.sequence>net.remotePlayed&&!seen.has(e.sequence)&&Array.isArray(e.sample)){
          net.remoteLaunches.push(e);seen.add(e.sequence);
        }
        net.remoteLaunches.sort((a,b)=>a.sequence-b.sequence);
      }
      function unpackDisplay(sample){
        const p={...pvpPlayers[0],afterimages:[]};
        [p.x,p.y,p.vx,p.vy,p.dir]=sample.slice(1,6);p.grounded=!!sample[6];p.charging=!!sample[7];p.charge=sample[8];
        p.bonked=!!sample[10];p.stunTimer=sample[11];p.catchSparkleTimer=sample[12]||0;
        p.tongue={...p.tongue,active:!!sample[13],elapsed:sample[14]||0,duration:sample[15]||.24,targetX:sample[16]||0,targetY:sample[17]||0,captured:!!sample[18]};
        p.landingSquash=sample[19]||0;return p;
      }
      function updateRemotePlayback(dt){
        if(!isGuestActive()||game.state!=='playing'){net.remoteDisplay=null;return;}
        const next=net.remoteLaunches.find(e=>e.sequence>net.remotePlayed);
        if(!net.remotePlay&&next){
          net.remotePlayed=next.sequence;net.remotePlay={sequence:next.sequence,time:next.t,elapsed:0};
          net.remoteDisplay=unpackDisplay(next.sample);return;
        }
        if(!net.remotePlay){net.remoteDisplay=null;return;}
        const play=net.remotePlay;play.time+=dt*1000;play.elapsed+=dt;
        const frames=net.remoteSamples;let a=null,b=null;
        for(let i=0;i<frames.length;i++){if(frames[i][0]<=play.time)a=frames[i];else{b=frames[i];break;}}
        if(a){
          const f=a.slice();if(b&&b[9]===a[9]){const u=clamp((play.time-a[0])/Math.max(1,b[0]-a[0]),0,1);for(const k of [1,2,3,4,8,12,14,19])f[k]=lerp(a[k],b[k],u);}
          net.remoteDisplay=unpackDisplay(f);
          if(!b&&!net.remoteDisplay.grounded&&play.time-a[0]<180){const p=net.remoteDisplay,t=Math.max(0,(play.time-a[0])/1000);p.x=clamp(p.x+p.vx*t,0,W-p.w);p.y+=p.vy*t+.5*CONFIG.gravity*t*t;p.vy+=CONFIG.gravity*t;}
          const ended=(a[9]===play.sequence&&!!a[6]&&play.elapsed>.04)||(a[9]>play.sequence);
          if(ended){net.remotePlay=null;net.remoteLaunches=net.remoteLaunches.filter(e=>e.sequence>net.remotePlayed);}
        }
        if(play.elapsed>3.5){net.remotePlay=null;net.remoteDisplay=null;}
      }
      function displayPlayer(p){
        if(!isGuestActive()||game.state!=='playing')return p;
        return surfaceLockedDisplay(p.index===0&&net.remoteDisplay?net.remoteDisplay:p);
      }
      function authoritativeCatch(player,fly,serial){
        if(!isHostActive()||game.onlinePredicting)return;
        net.catches.push({roundKey:currentRoundKey(),flyId:fly.id,vocabIndex:fly.vocabIndex,promptSerial:serial,player:player.index});
        net.catches=net.catches.slice(-100);preparePromptPlan();
        if(directReady())sendPeer('snapshot',captureDirectSnapshot());else scheduleExchange(0);
      }
      function rememberTongueContact(player){
        if(!isGuestActive()||player.index!==1)return;
        player.tongue.onlineContact={x:player.x,y:player.y,dir:player.dir,flightAge:Math.max(0,net.localFlightAge||0),
          inputSequence:net.localFlightSequence,serverAt:serverNow()};
      }
      function predictCatch(player,fly,source){
        if(!isGuestActive()||player.index!==1||net.predictionHold||!fly||fly.state!=='active'||pvpFlyBlockedForPlayer(fly,player))return false;
        if(!flyMatchesPrompt(fly))return beginPvpWrongCatch(player,fly,source==='tongue');
        if(net.predictedCatches.some(c=>c.roundKey===currentRoundKey()&&c.flyId===fly.id))return false;
        // Never speculate an unlimited series of points while disconnected.
        if(net.predictedCatches.length>=8||now()-state.lastSnapshotAt>6000)return false;
        const serial=game.promptSerial;
        const contact=source==='tongue'&&player.tongue.onlineContact?player.tongue.onlineContact:
          {x:player.x,y:player.y,dir:player.dir,flightAge:Math.max(0,net.localFlightAge||0),inputSequence:net.localFlightSequence,serverAt:serverNow()};
        const c={sequence:++net.claimSequence,matchId:state.resultMatchId,roundKey:currentRoundKey(),flyId:fly.id,vocabIndex:fly.vocabIndex,
          promptSerial:serial,source,...contact,createdAt:now(),confirmed:false};
        net.predictedCatches.push(c);net.pendingClaims.push(c);
        const i=flies.indexOf(fly);if(i>=0)flies.splice(i,1);
        if(player.tongue.targetFlyId===fly.id)player.tongue.captured=true;
        player.score++;player.catchSparkleTimer=CONFIG.catchSparkleDuration;
        if(game.pvpSuddenDeath)game.pvpSuddenDeathScores[1]++;
        const final=game.pvpSuddenDeath?game.pvpSuddenDeathScores[1]>=getPvpTargetScore():!isPvpEndlessMode()&&player.score>=getPvpTargetScore();
        if(final){game.targetVocabIndex=null;net.predictionHold=true;net.finalSpeculated=true;net.finalVisualElapsed=game.pvpCriticalCatchElapsed||0;}
        else {game.promptSerial=serial+1;game.targetVocabIndex=plannedTarget(serial+1);for(const f of flies)f.touchLocked=false;}
        // Predicted feedback never writes stats, achievements or leaderboard data.
        const was=game.onlinePredicting;game.onlinePredicting=false;try{playCorrectFlySound();}finally{game.onlinePredicting=was;}
        sendPeer('claims',[c]);if(!directReady())scheduleExchange(0);return true;
      }
      function updatePredictedFlies(dt){
        const p=pvpPlayers[1];
        if(!p.tongue.active&&!net.predictionHold&&!p.bonked&&p.stunTimer<=0&&game.pvpWinPendingIndex===null&&Number.isInteger(game.targetVocabIndex)){
          const touched=flies.find(f=>f.state==='active'&&!pvpFlyBlockedForPlayer(f,p)&&pvpPlayerTouchesFly(p,f));
          if(touched)predictCatch(p,touched,'body');
          else{
            const mouth=getPvpMouth(p);let target=null,dist=Infinity;
            for(const f of flies){if(f.state!=='active'||pvpFlyBlockedForPlayer(f,p))continue;
              const dx=f.baseX-mouth.x,dy=f.baseY-mouth.y,d=Math.abs(dx)+Math.abs(dy)*.35;
              if(dx*p.dir>=0&&Math.abs(dx)<=CONFIG.tongueReach&&Math.abs(dy)<=CONFIG.tongueVerticalTolerance&&d<dist){target=f;dist=d;}}
            if(target)beginPvpTongue(p,target);
          }
        }
        updatePvpTongue(p,dt);
        const other=pvpPlayers[0];if(other.tongue?.active){other.tongue.elapsed+=dt;if(other.tongue.elapsed>=other.tongue.duration)other.tongue.active=false;}
      }
      function registerGuestFlight(sequence,serverAt){
        const p=pvpPlayers[1], saved=encodePlayer(p);
        const item={sequence,serverAt,worldTime:game.worldTime,elapsed:game.pvpElapsed,player:saved,
          platforms:platforms.map(q=>({...q})),roundKey:currentRoundKey()};
        net.flights.set(sequence,item);while(net.flights.size>16)net.flights.delete(net.flights.keys().next().value);
      }
      function replayGuestFlight(flight,seconds){
        if(!flight||seconds<0||seconds>5)return null;
        const priorPlatforms=platforms,priorPredict=game.onlinePredicting,priorWorld=game.worldTime,priorElapsed=game.pvpElapsed;
        net.replaying=true;game.onlinePredicting=true;
        const p={...pvpPlayers[1],tongue:{...flight.player.tongue},afterimages:[]};
        try {
          platforms=flight.platforms.map(q=>({...q}));unpackPlayer(p,flight.player);
          // A replay must not inherit a later key hold, stun, or untrusted client position.
          p.inputHeld=false;p.charging=false;
          let t=0;while(t<seconds-.00001){const dt=Math.min(STEP,seconds-t);t+=dt;
            game.worldTime=flight.worldTime+t;game.pvpElapsed=flight.elapsed+t;
            for(const q of platforms)if(q.moving){const progress=getPvpPlatformMotionProgressAt(0);
              if(q.movementAxis==='y')q.y=lerp(q.innerY,q.outerY,progress);else q.x=lerp(q.innerX,q.outerX,progress);}
            updatePvpPlayer(p,dt);
          }
          return {data:encodePlayer(p),x:p.x,y:p.y,dir:p.dir,grounded:p.grounded};
        }finally{platforms=priorPlatforms;game.worldTime=priorWorld;game.pvpElapsed=priorElapsed;game.onlinePredicting=priorPredict;net.replaying=false;}
      }
      function compensateRemoteLaunch(e){
        if(!isHostActive()||pvpPlayers[1].grounded)return;
        const at=Number(e.serverAt)||serverNow(),lag=clamp((serverNow()-at)/1000,0,2.5);
        registerGuestFlight(e.sequence,at);pvpPlayers[1].onlineInputLaunchSequence=e.sequence;
        if(lag>.025&&!game.pvpCriticalCatchActive){
          const replay=replayGuestFlight(net.flights.get(e.sequence),lag);
          if(replay){const p=pvpPlayers[1], score=p.score,tongue=p.tongue;unpackPlayer(p,replay.data);
            p.score=score;p.tongue=tongue;p.inputHeld=state.remoteHeld;p.onlineInputLaunchSequence=e.sequence;}
        }
      }
      function receiveInputs(items){
        if(!isHostActive())return;
        for(const e of items.slice(0,96)){
          if(e&&Number.isSafeInteger(e.sequence)&&e.sequence>state.acknowledgedGuestInputSequence&&e.matchId===state.resultMatchId&&['down','up'].includes(e.action))net.remoteBuffer.set(e.sequence,e);
        }
        let count=0;
        while(net.remoteBuffer.has(state.acknowledgedGuestInputSequence+1)&&count++<96){
          const seq=state.acknowledgedGuestInputSequence+1,e=net.remoteBuffer.get(seq);net.remoteBuffer.delete(seq);
          if(!e.roundKey||e.roundKey===currentRoundKey())applyRemoteInput(e);
          state.acknowledgedGuestInputSequence=seq;
        }
        if(items.length)state.urgent=true;
      }
      function claimIsReachable(c,fly){
        const p=pvpPlayers[1];if(p.bonked||p.stunTimer>0)return false;
        if(!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(c.flightAge)||c.flightAge<0||c.flightAge>5)return false;
        const age=serverNow()-Number(c.serverAt||0);if(age < -450||age>6500)return false;
        const pose={...p,x:c.x,y:c.y,dir:c.dir<0?-1:1};
        let hit;
        if(c.source==='body')hit=pvpPlayerTouchesFly(pose,fly);
        else {const m=getPvpMouth(pose),dx=fly.baseX-m.x,dy=fly.baseY-m.y;hit=dx*pose.dir>=-1&&Math.abs(dx)<=CONFIG.tongueReach+2&&Math.abs(dy)<=CONFIG.tongueVerticalTolerance+2;}
        if(!hit)return false;
        if(Math.hypot(p.x-c.x,p.y-c.y)<=18)return true;
        if(net.guestTrace.some(q=>!q.bonked&&q.stun<=0&&Math.abs(q.at-c.serverAt)<950&&Math.hypot(q.x-c.x,q.y-c.y)<=16))return true;
        const flight=net.flights.get(c.inputSequence);
        if(!flight||flight.roundKey!==c.roundKey||p.wasBonkedThisJump)return false;
        // Bound a claimed point to an already received, host-created launch, then
        // replay the same platform physics. Coordinates alone never award a fly.
        if(c.flightAge>(serverNow()-flight.serverAt)/1000+.5)return false;
        const r=replayGuestFlight(flight,c.flightAge);
        return !!r&&r.dir===pose.dir&&Math.hypot(r.x-c.x,r.y-c.y)<=24;
      }
      function receiveClaims(items){
        if(!isHostActive())return;
        const ordered=items.filter(c=>c&&Number.isSafeInteger(c.sequence)&&c.sequence>net.claimAck&&c.matchId===state.resultMatchId).sort((a,b)=>a.sequence-b.sequence);
        for(const c of ordered){
          if(c.sequence!==net.claimAck+1)break;
          if(Number(c.inputSequence)>state.acknowledgedGuestInputSequence)break;
          let accepted=false,reason='CONFLICT';
          const logged=net.catches.find(q=>q.roundKey===c.roundKey&&q.flyId===c.flyId&&q.vocabIndex===c.vocabIndex);
          if(c.roundKey!==currentRoundKey())reason='OLD_ROUND';
          else if(logged){accepted=logged.player===1;reason=accepted?'CONFIRMED':'OTHER_PLAYER';}
          else {
            const f=flies.find(q=>q.id===c.flyId&&q.vocabIndex===c.vocabIndex&&q.state==='active');
            if(!f)reason='FLY_UNAVAILABLE';
            else if(c.promptSerial!==game.promptSerial||!flyMatchesPrompt(f))reason='PROMPT_CHANGED';
            else if(game.state!=='playing'||game.pvpWinPendingIndex!==null)reason='ROUND_FINISHED';
            else if(claimIsReachable(c,f)){accepted=completePvpCorrectCatch(pvpPlayers[1],f);reason=accepted?'CONFIRMED':'CONFLICT';}
            else reason='POSITION_CHANGED';
          }
          net.claimAck=c.sequence;net.receipts.push({sequence:c.sequence,roundKey:c.roundKey,flyId:c.flyId,accepted,reason});
          net.receipts=net.receipts.slice(-72);net.diagnosticClaims[accepted?'accepted':'rejected']++;
        }
      }
      function consumeCatchReceipts(s){
        const receipts=new Map((s.claimReceipts||[]).map(r=>[r.sequence,r]));
        const catches=s.confirmedCatches||[];
        net.predictedCatches=net.predictedCatches.filter(c=>{
          const receipt=receipts.get(c.sequence),record=catches.find(a=>a.roundKey===c.roundKey&&a.flyId===c.flyId&&a.vocabIndex===c.vocabIndex);
          if(receipt||record){
            const yes=receipt?receipt.accepted:record.player===1;
            if(!yes){net.correctionMessageUntil=now()+1400;net.finalSpeculated=false;net.finalVisualElapsed=0;}
            return false;
          }
          // Keep provisional catches visible until they are confirmed/rejected;
          // a stale host snapshot cannot resurrect the fly or previous prompt.
          return c.roundKey===s.roundKey&&now()-c.createdAt<9000;
        });
      }
      function overlayPredictedCatches(){
        net.predictionHold=false;
        if(!net.predictedCatches.length)return;
        const pending=net.predictedCatches.filter(c=>c.roundKey===currentRoundKey());
        for(const c of pending){const i=flies.findIndex(f=>f.id===c.flyId&&f.vocabIndex===c.vocabIndex);if(i>=0)flies.splice(i,1);}
        const p=pvpPlayers[1];p.score+=pending.length;if(game.pvpSuddenDeath)game.pvpSuddenDeathScores[1]+=pending.length;
        const last=pending[pending.length-1];
        if(last&&game.promptSerial<=last.promptSerial){game.promptSerial=last.promptSerial+1;game.targetVocabIndex=plannedTarget(game.promptSerial);}
        const final=game.pvpSuddenDeath?game.pvpSuddenDeathScores[1]>=getPvpTargetScore():!isPvpEndlessMode()&&p.score>=getPvpTargetScore();
        if(final){net.predictionHold=true;game.targetVocabIndex=null;}
      }
      function startBackgroundClock(){
        stopBackgroundClock();
        const pulse=()=>{if(!state.active)return;if(document.hidden)advanceOnlineSimulation(performance.now());pumpTransport();};
        try {
          const blob=new Blob(['setInterval(()=>postMessage(0),50);'],{type:'text/javascript'});
          const url=URL.createObjectURL(blob);net.worker=new Worker(url);URL.revokeObjectURL(url);
          net.worker.onmessage=pulse;net.worker.onerror=()=>{try{net.worker?.terminate();}catch(_){}net.worker=null;
            if(!net.fallbackTimer)net.fallbackTimer=setInterval(pulse,100);};
        }catch(_){net.fallbackTimer=setInterval(pulse,100);}
      }
      function stopBackgroundClock(){if(net.worker){try{net.worker.terminate();}catch(_){}net.worker=null;}clearInterval(net.fallbackTimer);net.fallbackTimer=null;}

      // Quickplay uses the existing realtime match transport; its low-frequency
      // queue and counts calls stop during play. No rating ever reaches a client.
      const quick={generation:0,inFlight:false,token:'',requestId:'',pollSequence:0,nextPollAt:0,
        counts:null,countsAt:0,statsBusy:false,nextStatsAt:0,joinedAt:0,error:'',message:'',
        connectingAt:0,roundStages:[],victoryKey:'',rematch:false,opponentRematch:false,
        pendingAction:'',changingMatch:false,queued:false,background:false,peekActivity:null,suspendedActivity:null,lastLocalSkin:'',queueTimer:null};
      const QUICK_UI={quick:{x:115,y:144,w:250,h:31},
        preview:{x:151,y:104,w:178,h:77},previous:{x:159,y:124,w:22,h:27},next:{x:299,y:124,w:22,h:27},
        enter:{x:144,y:196,w:192,h:26},cancel:{x:185,y:226,w:110,h:22},minimize:{x:115,y:194,w:250,h:28}};
      function isQuickplay(){return !!state.quickplay;}
      function quickRoundStage(number){return quick.roundStages[Math.max(0,Number(number)-1)]||'park';}
      function updateQuickCounts(counts){
        if(counts&&Number.isFinite(counts.ongoing)&&Number.isFinite(counts.queued)){
          quick.counts={ongoing:Math.max(0,counts.ongoing),queued:Math.max(0,counts.queued)};
          quick.countsAt=now();
        }
      }
      async function refreshQuickCounts(){
        if(quick.statsBusy||!onlineAllowed())return;
        quick.statsBusy=true;quick.nextStatsAt=now()+3500;
        try{const r=await RibbitCloud.quickplayStatus();
          if(r?.ok&&r.quickplayVersion===3)updateQuickCounts(r.counts);
        }catch(_){/* Counts must never interrupt private rooms or gameplay. */}
        finally{quick.statsBusy=false;quick.nextStatsAt=now()+3500;}
      }
      function openQuickplay(){
        if(quick.queued){showQueuedStatus();return;}
        if(!onlineAllowed()){setStatus('SIGN IN TO USE QUICKPLAY.',true);return;}
        quick.generation++;quick.error='';quick.message='';quick.token='';quick.pendingAction='';
        quick.rematch=quick.opponentRematch=false;quick.changingMatch=false;
        state.screen='quickSelect';state.focus='quickFrog';game.state='onlineConnect';
        state.localSkinId=normalizePvpSkinId(state.localSkinId||game.pvpSetupSkinIds?.[0],'azure');
        if(!isPvpSkinAvailable(state.localSkinId))state.localSkinId='azure';
        state.localAppearance=appearanceFor(state.localSkinId);canvas.focus({preventScroll:true});
        refreshQuickCounts();
      }
      function quickCycleSkin(delta){
        if(state.screen!=='quickSelect')return;
        const options=PVP_FROG_SKIN_ORDER.filter(id=>isPvpSkinAvailable(id));
        if(!options.length)return;
        const pos=Math.max(0,options.indexOf(state.localSkinId));
        state.localSkinId=options[(pos+delta+options.length)%options.length];state.localAppearance=appearanceFor(state.localSkinId);
        tone(430,.045,.01,45);quick.error='';
      }
      async function enterQuickplay(){
        if(state.screen!=='quickSelect'||quick.inFlight||state.busy)return;
        const gen=++quick.generation;state.busy=true;quick.error='';
        gate.lastAttempt={kind:'quick'};quick.message='CHECKING THIS DEVICE FOR SERVER PLAY';
        try{
          await checkLocalDirectCapability();
          if(gen!==quick.generation||state.screen!=='quickSelect')return;
          state.busy=false;quick.token='';quick.requestId=commandId('queue');quick.pollSequence=0;
          quick.joinedAt=Date.now();quick.error='';quick.message='BROWSER CHECK PASSED - FINDING AN OPPONENT';
          quick.rematch=quick.opponentRematch=false;quick.nextPollAt=0;quick.queued=true;quick.background=false;
          quick.lastLocalSkin=normalizePvpSkinId(game.skinId==='custom'?'custom'+(activeCustomFrogSlotIndex+1):game.skinId,'azure');
          state.localAppearance=appearanceFor(state.localSkinId);state.screen='quickQueue';
          game.state='onlineConnect';RibbitCloud.setOnlineRealtimeActive?.(false);exchangeQuickplay();
        }catch(e){
          if(gen===quick.generation&&e.code!=='DIRECT_CANCELLED')failDirect(e.message);
        }finally{if(gen===quick.generation)state.busy=false;}
      }

      function acceptQuickplayResponse(r){
        if(!r?.ok)throw Object.assign(new Error(r?.message||'Quickplay is unavailable.'),{code:r?.code||''});
        if(r.quickplayVersion!==3||r.directOnlyVersion!==DIRECT.version)throw Object.assign(new Error('Install Direct Connect 2 OnlineVersus.gs and redeploy.'),{code:'UPDATE_REQUIRED'});
        if(r.queueToken)quick.token=r.queueToken;
        updateQuickCounts(r.counts);if(r.joinedAt)quick.joinedAt=r.joinedAt;
        quick.nextPollAt=now()+Math.max(750,Math.min(3000,Number(r.pollAfterMs)||1250));
        if(r.status==='matched'&&r.connection){
          quick.suspendedActivity=quick.background?captureLocalActivity():(quick.peekActivity||quick.suspendedActivity);
          quick.peekActivity=null;quick.queued=false;quick.background=false;clearTimeout(quick.queueTimer);
          hideRgbValueEditor(true);game.customHatOpen=false;game.customHatSearchFocused=false;
          RibbitCloud.flushSave?.(true);
          quick.connectingAt=now();quick.message='MATCH FOUND - CHECKING SERVER CONNECTION';
          connect({...r.connection,quickplay:true,rules:r.connection.rules});
          return;
        }
        quick.message='FINDING AN OPPONENT';quick.error='';
      }
      async function exchangeQuickplay(){
        if(quick.inFlight||!quick.queued)return;
        refreshQueuedAppearance();
        quick.inFlight=true;const generation=quick.generation;
        try {
          const r=quick.token?await RibbitCloud.quickplayPoll({quickplayVersion:3,displayName:onlineName(),queueToken:quick.token,sequence:++quick.pollSequence,skinId:state.localSkinId,appearance:state.localAppearance}):
            await RibbitCloud.quickplayEnter({quickplayVersion:3,directCapable:gate.preflight?.ok===true,displayName:onlineName(),requestId:quick.requestId,skinId:state.localSkinId,
              appearance:state.localAppearance,vocabulary:VOCABULARY});
          if(generation!==quick.generation){if(r?.queueToken)cancelQuickplayTicket(r.queueToken);return;}
          acceptQuickplayResponse(r);
        }catch(e){
          if(generation!==quick.generation)return;
          if(e.code==='DIRECT_PAIR_CLOSED'){quick.queued=false;quick.background=false;failDirect(e.message);}
          else if(e.code==='QUEUE_EXPIRED'){quick.token='';quick.requestId=commandId('queue');quick.nextPollAt=now()+750;quick.message='QUEUE REFRESHED - FINDING AN OPPONENT';}
          else if(['QUEUE_BUSY','QUEUE_FULL'].includes(e.code)){quick.nextPollAt=now()+1600;quick.message='MATCHMAKING BUSY - RETRYING';}
          else {quick.error=String(e.message||e).slice(0,100);quick.nextPollAt=now()+2500;
            if(/ALREADY_|SESSION_|UPDATE_|STUDENT_|ACCOUNT_/.test(e.code||'')){quick.queued=false;quick.background=false;state.screen='quickSelect';game.state='onlineConnect';RibbitCloud.setOnlineRealtimeActive?.(false);}}
        }finally{quick.inFlight=false;clearTimeout(quick.queueTimer);if(quick.queued)quick.queueTimer=setTimeout(exchangeQuickplay,Math.max(500,quick.nextPollAt-now()));}
      }
      async function cancelQuickplayTicket(token,attempt=0){
        if(!token)return;
        try{const r=await RibbitCloud.quickplayCancel({quickplayVersion:3,queueToken:token});
          if(!r?.ok&&attempt<2)setTimeout(()=>cancelQuickplayTicket(token,attempt+1),700);
        }catch(_){if(attempt<2)setTimeout(()=>cancelQuickplayTicket(token,attempt+1),700);}
      }
      function cancelQuickplay(){
        cancelDirectPreflight();state.busy=false;
        const token=quick.token,saved=quick.peekActivity;quick.generation++;quick.token='';quick.pendingAction='';
        const background=quick.background;quick.queued=false;quick.background=false;quick.peekActivity=null;clearTimeout(quick.queueTimer);
        quick.error='';state.busy=false;RibbitCloud.setOnlineRealtimeActive?.(false);cancelQuickplayTicket(token);
        if(background){state.screen='closed';return;}
        if(restoreLocalActivity(saved)){state.screen='closed';return;}
        state.screen='entry';state.focus='quick';game.state='onlineConnect';setStatus('HOST, JOIN, OR FIND A QUICKPLAY MATCH');
      }
      async function requeueQuickplay(){
        if(quick.changingMatch)return;quick.changingMatch=true;
        const skin=state.localSkinId,wasConnected=state.connected;
        const request={protocol:3,roomCode:state.roomCode,playerToken:state.playerToken};
        quick.message='RETURNING TO QUICKPLAY';
        try{if(wasConnected)await RibbitCloud.leaveOnlineRoom(request);}catch(_){}
        const suspended=quick.suspendedActivity;cleanup(false);quick.suspendedActivity=suspended;open();state.localSkinId=skin;state.localAppearance=appearanceFor(skin);
        quick.inFlight=false;quick.changingMatch=false;state.screen='quickSelect';enterQuickplay();
      }
      function quickVictoryAction(id){
        if(!state.quickplay)return false;
        if(game.pvpMatchWinnerIndex===null)return true;
        const action=id==='replay'?'rematch':id==='select'?'requeue':'leave';
        if(action==='rematch'&&!state.remoteConnected){quick.message='OPPONENT LEFT - SELECT REQUEUE';return true;}
        if(state.resultSeenMatchId!==state.resultMatchId){quick.pendingAction=action;quick.message='SAVING MATCH RESULT';return true;}
        finishQuickAction(action);return true;
      }
      function finishQuickAction(action){
        quick.pendingAction='';
        if(action==='rematch'){
          if(!directReady()){quick.message='SERVER CONNECTION ENDED - SELECT REQUEUE';return;}
          quick.rematch=true;quick.message=quick.opponentRematch?'REMATCH STARTING':'REMATCH REQUESTED - WAITING';scheduleExchange(0);
        }else if(action==='requeue')requeueQuickplay();
        else leaveRoom();
      }
      function quickSecondsLeft(){
        return Math.max(0,Math.min(5,Math.ceil(((Number(game.quickplayNextRoundAt)||serverNow()+5000)-serverNow())/1000)));
      }
      function tickQuickplay(){
        const visible=['entry','quickSelect','quickQueue'].includes(state.screen);
        if(visible&&onlineAllowed()&&state.screen!=='quickQueue'&&now()>=quick.nextStatsAt)refreshQuickCounts();
        if(quick.queued&&!quick.inFlight&&now()>=quick.nextPollAt)exchangeQuickplay();
        if(state.quickplay&&state.connected&&!state.active&&state.screen==='quickConnecting'&&now()-quick.connectingAt>DIRECT.connectMs){
          failDirect('MATCH SETUP TIMED OUT. NO RELAY MATCH WAS STARTED.');return;
        }
        if(!state.quickplay||!state.active||game.state!=='won')return;
        if(game.pvpMatchWinnerIndex===null){
          if(isAuthority()){
            const key=currentRoundKey();
            if(quick.victoryKey!==key){quick.victoryKey=key;game.quickplayNextRoundAt=serverNow()+5000;scheduleExchange(0);}
            if(serverNow()>=game.quickplayNextRoundAt&&game.quickplayNextRoundAt>0){
              game.quickplayNextRoundAt=0;releaseHeldControl();state.remoteHeld=false;continuePvpMatch();
            }
          }
        }else if(quick.pendingAction&&state.resultSeenMatchId===state.resultMatchId&&!quick.changingMatch){
          finishQuickAction(quick.pendingAction);
        }
      }
      function drawQuickCounts(y=80){
        const fresh=quick.counts&&now()-quick.countsAt<15000;
        const label=fresh?`${quick.counts.ongoing} ${quick.counts.ongoing===1?'MATCH':'MATCHES'} LIVE   -   ${quick.counts.queued} IN QUEUE`:'CHECKING LIVE MATCHES AND QUEUE...';
        fitText(label,W/2,y,372,.7,fresh?'#174f65':'#72838a');
      }
      function drawQuickplayScreen(){
        drawPanel('QUICKPLAY');
        const selecting=state.screen==='quickSelect',queued=state.screen==='quickQueue';
        const title=selecting?'CHOOSE YOUR FROG':queued?'FINDING AN OPPONENT':'MATCH FOUND';
        fitText(title,W/2,64,372,.92,'#174f65');drawQuickCounts(82);
        const r=QUICK_UI.preview,palette=state.localAppearance||appearanceFor(state.localSkinId);
        ctx.fillStyle='rgba(25,43,52,.22)';ctx.fillRect(r.x+2,r.y+2,r.w,r.h);
        ctx.fillStyle=palette.dark||COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.fillStyle=palette.belly||'#b8f5dc';ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
        ctx.fillStyle=palette.light||'#5ce5e8';ctx.fillRect(r.x+7,r.y+6,r.w-14,3);
        ctx.save();ctx.beginPath();ctx.rect(r.x+4,r.y+10,r.w-8,r.h-13);ctx.clip();
        drawMiniFrogSwatchFacing(W/2,r.y+22,palette,2.15,1);ctx.restore();
        fitText(palette.name||state.localSkinId,W/2,r.y+65,r.w-14,.85,palette.dark);
        if(selecting){drawPagerArrowIcon(QUICK_UI.previous,-1,'#48555a');drawPagerArrowIcon(QUICK_UI.next,1,'#48555a');}
        if(selecting){
          fitText('60 SECOND ENDLESS - RANDOM STAGES - BEST OF 3',W/2,185,376,.62);
          drawPvpSetupActionButton(QUICK_UI.enter,state.busy?'CHECKING DEVICE':'FIND MATCH',state.focus==='quickEnter',palette);
        }else {
          const wait=Math.max(0,Math.floor((Date.now()-quick.joinedAt)/1000));
          fitText(queued?`SEARCHING ${wait} SEC`:(state.remoteConnected?roomPlayerLabel(1-localIndex()):'CONNECTING TO OPPONENT'),W/2,190,360,.88,'#174f65');
          if(queued)drawPvpSetupActionButton(QUICK_UI.minimize,'PLAY WHILE WAITING',state.focus==='quickMinimize',palette);
          else fitText(directStatus(),W/2,207,390,.62,'#07516a');
        }
        if(quick.error)fitText(quick.error,W/2,224,390,.53,'#96334c');
        else if(selecting)fitText(state.busy?'CHECKING WEBRTC - PARTNER TEST FOLLOWS MATCHING':'FRIENDS ONLINE - NO AUTOMATIC RELAY FALLBACK',240,225,386,.5,'#07516a');
        else if(queued){/* Status is centered inside PLAY WHILE WAITING. */}
        if(selecting||queued)drawPvpSetupActionButton(QUICK_UI.cancel,selecting?'BACK':'CANCEL',state.focus==='quickCancel',PVP_NEUTRAL_PALETTE);
        else drawOnlineAction({...ENTRY.back,label:'CANCEL',icon:'back',stripe:'#bac8cf'},state.focus==='back');
      }
      function quickMenuKey(e){
        const screen=state.screen;
        if(!['quickSelect','quickQueue','quickConnecting'].includes(screen))return false;
        e.preventDefault();e.stopImmediatePropagation();
        if(e.repeat)return true;
        if(e.code==='Escape'){if(screen==='quickConnecting')leaveRoom();else if(screen==='quickQueue')minimizeQueue();else cancelQuickplay();return true;}
        if(screen==='quickQueue'){if(e.code==='KeyC')cancelQuickplay();else if(['Enter','NumpadEnter','Space'].includes(e.code))minimizeQueue();return true;}
        if(screen!=='quickSelect')return true;
        if(['ArrowLeft','KeyA'].includes(e.code))quickCycleSkin(-1);
        else if(['ArrowRight','KeyD'].includes(e.code))quickCycleSkin(1);
        else if(e.code==='Tab'){state.focus=state.focus==='quickEnter'?'quickCancel':'quickEnter';}
        else if(['Enter','NumpadEnter','Space'].includes(e.code)){if(state.focus==='quickCancel')cancelQuickplay();else enterQuickplay();}
        return true;
      }
      function quickPointer(p){
        if(!['quickSelect','quickQueue','quickConnecting'].includes(state.screen))return false;
        if(state.screen==='quickSelect'){
          if(pointInsideRect(p,QUICK_UI.previous))quickCycleSkin(-1);
          else if(pointInsideRect(p,QUICK_UI.next))quickCycleSkin(1);
          else if(pointInsideRect(p,QUICK_UI.enter))enterQuickplay();
          else if(pointInsideRect(p,QUICK_UI.cancel))cancelQuickplay();
        }else if(state.screen==='quickQueue'){if(pointInsideRect(p,QUICK_UI.cancel))cancelQuickplay();else if(pointInsideRect(p,QUICK_UI.minimize))minimizeQueue();}
        return true;
      }
      function quickVictoryLabel(id){
        if(game.pvpMatchWinnerIndex===null)return id==='replay'?`NEXT IN ${quickSecondsLeft()}`:'';
        if(id==='replay')return quick.rematch?'WAITING':'REMATCH';
        return id==='select'?'REQUEUE':'LEAVE';
      }
      function quickVictoryMessage(){
        if(game.pvpMatchWinnerIndex===null)return `NEXT ROUND IN ${quickSecondsLeft()}`;
        if(state.resultSeenMatchId!==state.resultMatchId)return 'SAVING MATCH RESULT';
        if(!state.remoteConnected)return 'OPPONENT LEFT - REQUEUE FOR A NEW MATCH';
        if(quick.pendingAction)return 'SAVING YOUR CHOICE';
        if(quick.changingMatch)return 'FINDING YOUR NEXT MATCH';
        if(quick.rematch)return quick.opponentRematch?'REMATCH STARTING':'WAITING FOR OPPONENT TO REMATCH';
        if(quick.opponentRematch)return 'YOUR OPPONENT WANTS A REMATCH';
        return 'REMATCH OR FIND A NEW OPPONENT';
      }

      // A round is loaded on both laptops BEFORE scheduling one shared GO time.
      // This state is independent of animation frames and packet arrival cadence.
      const syncClock={key:'',revision:0,phase:'loading',countdownAt:0,goAt:0,
        loaded:false,complete:false,lastNumber:-1,firstPlayAt:0,worldTarget:null,worldSampleAt:0,worldRate:1};
      const life={wrongLocks:new Map(),tongueDone:new Set(),criticalDone:new Set(),criticalKey:'',
        criticalElapsed:0,replayFrames:[],replaySeq:0,replayBase:0,replayLast:0,replayLastSend:0,replayAck:0};
      function resetRoundLifecycle(key){
        life.wrongLocks.clear();life.tongueDone.clear();life.criticalDone.clear();life.criticalKey='';life.criticalElapsed=0;
        game.pvpCriticalCatchEventId='';game.pvpCriticalCatchPlayedThisRound=false;
        Object.assign(syncClock,{key,revision:0,phase:'loading',countdownAt:0,goAt:0,
          loaded:isAuthority(),complete:false,lastNumber:-1,worldTarget:null,worldSampleAt:now()});
      }
      function readStartSync(s){
        if(!s||s.key!==currentRoundKey()||Number(s.revision)<syncClock.revision)return;
        if(syncClock.complete&&s.key===syncClock.key)return;
        const rank={loading:0,scheduled:1,committed:2,playing:3};
        if(Number(s.revision)===syncClock.revision&&(rank[s.phase]||0)<(rank[syncClock.phase]||0))return;
        Object.assign(syncClock,{key:s.key,revision:Number(s.revision)||0,phase:s.phase,
          countdownAt:Number(s.countdownAt)||0,goAt:Number(s.goAt)||0});
      }
      function synchronizedCountdown(dt){
        if(!state.active||syncClock.key!==currentRoundKey()||syncClock.complete||game.state!=='countdown')return false;
        const committed=['committed','playing'].includes(syncClock.phase),t=serverNow();
        const number=committed&&t>=syncClock.countdownAt?Math.max(0,Math.min(3,Math.ceil((syncClock.goAt-t)/750))):3;
        game.countdownNumber=number;game.countdownTimer=Math.max(0,(syncClock.goAt-t)/1000);
        if(committed&&t>=syncClock.countdownAt&&number!==syncClock.lastNumber){
          syncClock.lastNumber=number;if(number>0)playCountdownSound(number);
        }
        if(committed&&syncClock.goAt>0&&t>=syncClock.goAt){
          syncClock.complete=true;syncClock.firstPlayAt=t;
          game.state='playing';game.countdownNumber=0;game.countdownTimer=0;
          game.onlineStartLateMs=Math.max(0,t-syncClock.goAt);
          // A delayed UI frame starts on the agreed timeline; it never starts
          // a second local 3-2-1 or makes the opponent repeat their countdown.
          const late=Math.min(.25,Math.max(0,t-syncClock.goAt)/1000);
          if(!game.pvpSuddenDeath){game.elapsed=game.pvpElapsed=late;game.worldTime=late;
            if(game.pvpTimeLimitSeconds>0)game.pvpTimeRemaining=Math.max(0,game.pvpTimeLimitSeconds-late);}
          syncClock.worldTarget=game.worldTime;syncClock.worldSampleAt=now();
          playCountdownGoSound();state.awaitingHostFrame=false;scheduleExchange(0);
        }
        return true;
      }
      function drawSyncLabel(){
        if(state.active&&gate.lossAt&&state.cpuIndex<0){
          ctx.save();ctx.fillStyle='rgba(16,35,45,.66)';ctx.fillRect(60,86,360,69);
          fitText(gate.expectedDeparture?'PARTNER LEFT':'RECONNECTING DIRECT',240,98,337,1.05,'#ffffff');
          fitText('LIVE RELAY PLAY IS DISABLED',240,120,330,.72,'#b8f5dc');
          fitText('RESTORING THE LINK OR CHECKING CPU TAKEOVER',240,138,336,.57,'#ffffff');ctx.restore();return;
        }
        if(!preparingStart())return;
        ctx.save();ctx.fillStyle='rgba(16,35,45,.46)';ctx.fillRect(0,0,W,CONFIG.playBottom);
        const r={x:71,y:88,w:338,h:53};ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.fillStyle='#f7fdff';ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
        ctx.fillStyle='#5ce5e8';ctx.fillRect(r.x+7,r.y+7,r.w-14,3);
        fitText(syncClock.phase==='loading'?'LOADING BOTH PLAYERS':'SYNCHRONIZING PLAYERS',240,r.y+18,r.w-20,1.2,'#07516a');
        fitText('THE COUNTDOWN STARTS WHEN BOTH ARE READY',240,r.y+37,r.w-20,.62,'#59666b');ctx.restore();
      }
      function tongueActionId(p,fly){return currentRoundKey()+':tongue:'+p.index+':'+fly.id+':'+game.promptSerial;}
      function beginTongueAction(p,f){
        if(!state.active)return true;
        const key=tongueActionId(p,f);
        if(life.tongueDone.has(key)||(p.tongue.active&&p.tongue.actionId===key))return false;
        p.tongue.actionId=key;p.tongue.promptAtLaunch=game.promptSerial;
        return true;
      }
      function finishTongueAction(p){
        if(state.active&&p.tongue.actionId)life.tongueDone.add(p.tongue.actionId);
      }
      function rememberWrongFly(p,f){
        if(!isGuestActive()||p.index!==1)return;
        life.wrongLocks.set(f.id,{serial:game.promptSerial,fly:f});
      }
      function wrongFlyBlocked(p,f){
        if(!isGuestActive()||p.index!==1)return false;
        return life.wrongLocks.get(f.id)?.serial===game.promptSerial;
      }
      function mergeWrongFlyVisuals(){
        for(const [id,item]of life.wrongLocks){
          if(item.serial!==game.promptSerial){life.wrongLocks.delete(id);continue;}
          const i=flies.findIndex(f=>f.id===id);if(i<0)continue;
          const incoming=flies[i],local=item.fly;
          // An old host frame cannot start a second pull/spit or unlock the
          // same incorrect fly for the guest in the same vocabulary prompt.
          if(local.state==='spitting'||incoming.state==='spitting'){
            if(local.spitElapsed>=incoming.spitElapsed||incoming.state==='active')flies[i]=local;
            else item.fly=incoming;
          }
          const f=flies[i];if(!Array.isArray(f.pvpBlockedPromptSerials))f.pvpBlockedPromptSerials=[-1,-1];
          f.pvpBlockedPromptSerials[1]=item.serial;
        }
      }
      function reconcileTongue(p,old,hard){
        if(!isGuestActive()||hard)return;
        const t=p.tongue;
        if(p.index===1&&old.active&&!p.bonked&&p.stunTimer<=0){p.tongue={...old};return;}
        if(t.active&&t.actionId&&life.tongueDone.has(t.actionId)){t.active=false;t.captured=true;return;}
        if(t.active&&old.actionId&&old.actionId===t.actionId){
          t.elapsed=Math.max(Number(t.elapsed)||0,Number(old.elapsed)||0);t.captured=!!t.captured||!!old.captured;
          if(t.elapsed>=t.duration){t.active=false;finishTongueAction(p);}
        }
      }
      function canStartCritical(key){
        if(!state.active)return true;
        if(game.pvpCriticalCatchPlayedThisRound||life.criticalDone.has(key)||life.criticalKey===key)return false;
        life.criticalKey=key;life.criticalElapsed=0;return true;
      }
      function criticalProgress(){
        if(!state.active||!game.pvpCriticalCatchEventId)return;
        const key=game.pvpCriticalCatchEventId;
        life.criticalKey=key;life.criticalElapsed=Math.max(life.criticalElapsed,Number(game.pvpCriticalCatchElapsed)||0);
        if(life.criticalElapsed>=game.pvpCriticalCatchDuration){life.criticalDone.add(key);game.pvpCriticalCatchActive=false;}
      }
      function reconcileCritical(s,old){
        const incoming=s.game||{},key=incoming.pvpCriticalCatchEventId||old.key;
        if(!key)return;
        if(life.criticalKey&&life.criticalKey!==key)life.criticalElapsed=0;
        life.criticalKey=key;game.pvpCriticalCatchEventId=key;
        game.pvpCriticalCatchPlayedThisRound=!!incoming.pvpCriticalCatchPlayedThisRound||old.played;
        life.criticalElapsed=Math.max(life.criticalElapsed,Number(incoming.pvpCriticalCatchElapsed)||0,old.key===key?old.elapsed:0);
        game.pvpCriticalCatchElapsed=life.criticalElapsed;
        if(life.criticalDone.has(key)||life.criticalElapsed>=game.pvpCriticalCatchDuration){
          life.criticalDone.add(key);game.pvpCriticalCatchActive=false;return;
        }
        if(old.active&&old.key===key&&(net.predictionHold||incoming.pvpCriticalCatchActive))game.pvpCriticalCatchActive=true;
      }
      function alignSnapshotRider(p,data,s){
        if(!data.grounded||data.bonked||!Array.isArray(s.platforms))return;
        const i=platforms.findIndex((q,i)=>s.platforms[i]&&Math.abs(data.y+p.h-s.platforms[i].y)<3&&
          data.x+p.w>s.platforms[i].x&&data.x<s.platforms[i].x+q.w);
        if(i<0)return;
        p.x=clamp(data.x+(platforms[i].x-s.platforms[i].x),0,W-p.w);p.y=platforms[i].y-p.h;
        p.vx=0;p.vy=0;p.grounded=true;
      }
      function setPlatformsToClock(){
        const phase=getPvpPlatformMotionProgressAt(0);
        for(const q of platforms)if(q.moving){if(q.movementAxis==='y')q.y=lerp(q.innerY,q.outerY,phase);else q.x=lerp(q.innerX,q.outerX,phase);}
      }
      function advanceSmoothWorld(sim){
        let correction=0;
        if(Number.isFinite(syncClock.worldTarget)){
          const target=syncClock.worldTarget+(now()-syncClock.worldSampleAt)/1000*syncClock.worldRate;
          correction=clamp((target-game.worldTime)*1.8,-.18,.18);
        }
        game.worldTime+=sim*(1+correction);
      }

      // Quickplay queue membership is independent of the active local screen.
      function captureLocalActivity(){
        if(['onlineConnect','onlineSetup'].includes(game.state)||state.active||watch.active)return null;
        try{return structuredClone({game,frog,tongue,flies,platforms,flySpawns,VOCABULARY,nextFlyId});}
        catch(_){return null;}
      }
      function restoreLocalActivity(saved){
        if(!saved)return false;
        Object.assign(game,saved.game);Object.assign(frog,saved.frog);Object.assign(tongue,saved.tongue);
        platforms=saved.platforms;flySpawns=saved.flySpawns;VOCABULARY=saved.VOCABULARY;nextFlyId=saved.nextFlyId;
        flies.length=0;flies.push(...saved.flies);
        game.onlineMode=false;game.onlineRole=null;game.onlinePredicting=false;
        game.buttonHeld=false;frog.charging=false;clearSoloPhysicalInputState(false);
        if(game.mode==='solo'&&game.state==='playing'){game.state='paused';game.pauseSelection='continue';game.pauseFocusVisible=true;}
        lastFrameTime=performance.now();accumulator=0;syncTimeOfDayChrome();return true;
      }
      function minimizeQueue(){
        if(!quick.queued)return;
        state.screen='closed';quick.background=true;RibbitCloud.setOnlineRealtimeActive?.(false);
        const saved=quick.peekActivity;quick.peekActivity=null;
        if(!restoreLocalActivity(saved))openMainMenu(false);
      }
      function showQueuedStatus(){
        if(!quick.queued)return;
        if(quick.background)quick.peekActivity=captureLocalActivity();
        quick.background=false;state.screen='quickQueue';game.state='onlineConnect';
      }
      function refreshQueuedAppearance(){
        if(!quick.queued||!quick.background)return;
        // Commit/equip actions affect the queued appearance; unsaved RGB drafts
        // stay local until the player presses USE, just as outside Quickplay.
        const stored=normalizePvpSkinId(game.skinId==='custom'?'custom'+(activeCustomFrogSlotIndex+1):game.skinId,'azure');
        if(quick.lastLocalSkin!==stored){quick.lastLocalSkin=stored;state.localSkinId=stored;}
        state.localAppearance=appearanceFor(state.localSkinId);
      }
      function queueBadgeRect(){return {x:12,y:['playing','paused','countdown','won'].includes(game.state)?234:250,w:172,h:11};}
      function drawQueueBadge(){
        let rail=document.getElementById('rr-queue-rail');
        const visible=quick.queued&&quick.background&&!state.active&&!watch.active;
        gameFrame.classList.toggle('rr-queue-reserved',visible);
        if(!visible)return;
        if(!rail){
          rail=document.createElement('div');rail.id='rr-queue-rail';rail.setAttribute('aria-label','Quickplay queue');
          const label=document.createElement('span');label.id='rr-queue-status';label.setAttribute('role','status');rail.appendChild(label);
          for(const [text,action]of [['VIEW QUEUE',showQueuedStatus],['CANCEL',cancelQuickplay]]){const button=document.createElement('button');button.type='button';button.textContent=text;
            button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();action();});rail.appendChild(button);}
          gameFrame.appendChild(rail);
        }
        const seconds=Math.max(0,Math.floor((Date.now()-quick.joinedAt)/1000)),text='QUICKPLAY SEARCHING '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
        const label=document.getElementById('rr-queue-status');if(label.textContent!==text)label.textContent=text;
      }

      // Replay recording is a fixed-rate host task, independent of spectator
      // count. Spectators download these prior frames from the Friends replay store.
      const WATCH_UI={button:{x:115,y:180,w:250,h:26},back:{x:177,y:230,w:126,h:23},
        code:{x:65,y:195,w:225,h:25},go:{x:303,y:195,w:110,h:25},exit:{x:446,y:32,w:25,h:19}};
      const watch={active:false,inFlight:false,generation:0,rooms:[],code:'',token:'',epoch:'',matchId:'',cursor:-1,
        frames:[],meta:null,playT:null,nextPollAt:0,message:'',error:'',oldVocabulary:null,ended:false,paused:false,codeFocus:false};
      const REPLAY_STATES=['countdown','playing','pvpSuddenDeathAlert','pvpCelebration','won'];
      const REPLAY_EFFECTS=['footstool','bounce','thud','bonk'];
      function compactReplayFrame(){
        const g=game,n=v=>Number.isFinite(Number(v))?Math.round(Number(v)*1000)/1000:0,idx=v=>Number.isInteger(v)?v:-1;
        return {q:++life.replaySeq,t:Math.round(now()-life.replayBase),s:g.state,l:g.selectedLevelId,
          g:[g.worldTime,g.pvpElapsed,g.pvpTimeRemaining,g.pvpRoundNumber,...g.pvpRoundWins,idx(g.pvpWinnerIndex),idx(g.pvpMatchWinnerIndex),idx(g.pvpWinPendingIndex),
            +g.pvpSuddenDeath,...g.pvpSuddenDeathScores,idx(g.targetVocabIndex),g.promptSerial,g.countdownNumber,+g.pvpCriticalCatchActive,g.pvpCriticalCatchElapsed,
            idx(g.pvpCriticalCatchWinnerIndex),TIME_OF_DAY_OPTIONS.indexOf(g.timeOfDay),g.moonPhaseIndex,g.pvpFinalDisplayTime??-1,
            g.pvpTimeLimitSeconds,+isPvpEndlessMode(),g.pvpFirstTo,g.pvpBestOf,g.winInputLock].map(n),
          p:pvpPlayers.map(p=>{const t=p.tongue;return [p.x,p.y,p.vx,p.vy,p.dir,+p.grounded,+p.charging,p.charge,+p.bonked,p.stunTimer,p.score,
            p.landingSquash,+p.blinking,p.catchSparkleTimer,p.wrongCatchBubbleTimer,p.lastLaunchPower,p.streakTimer,+t.active,t.elapsed,t.duration,
            t.targetX,t.targetY,+t.captured,t.targetFlyId??-1,t.promptAtLaunch??g.promptSerial,p.airTime].map(n);}),
          f:flies.map(f=>[f.id,f.baseX,f.baseY,f.x,f.y,f.vocabIndex,+(f.state==='spitting'),f.spawnAge,f.phase,f.spitElapsed,f.spitDuration,f.spitDelay,f.spitOwnerIndex??-1].map(n)),
          fx:(g.pvpImpactEffects||[]).slice(-5).map(e=>[REPLAY_EFFECTS.indexOf(e.type),e.x,e.y,e.elapsed,e.duration].map(n))};
      }
      function captureReplayTick(){
        if(!isHostActive()||!REPLAY_STATES.includes(game.state)||now()-life.replayLast<125)return;
        life.replayLast=now();life.replayFrames.push(compactReplayFrame());
        if(life.replayFrames.length>160)life.replayFrames.splice(0,life.replayFrames.length-160);
      }
      async function openSpectate(){
        if(state.connected||state.active)return;
        if(!onlineAllowed()){setStatus('SIGN IN TO SPECTATE',true);return;}
        state.screen='spectateList';game.state='onlineConnect';watch.code='';watch.codeFocus=false;watch.rooms=[];watch.error='';watch.message='LOADING RECORDED ROOMS';
        const gen=++watch.generation;
        try{const r=await RibbitCloud.watchRooms();if(gen!==watch.generation)return;
          if(!r?.ok)throw new Error(r?.message||'Could not list replay rooms.');watch.rooms=r.rooms||[];watch.message=watch.rooms.length?'SELECT A RECORDED ROOM':'NO RECORDED ROOMS YET';
        }catch(e){if(gen===watch.generation)watch.error=String(e.message||e);}
      }
      function startSpectating(code){
        code=String(code||'').toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,5);
        if(code.length!==5){watch.error='ENTER A FIVE-CHARACTER ROOM ID';return;}
        watch.generation++;watch.active=true;watch.token='';watch.epoch='';watch.matchId='';watch.cursor=-1;
        watch.frames=[];watch.playT=null;watch.meta=null;watch.code=code;watch.nextPollAt=0;watch.inFlight=false;watch.error='';watch.paused=false;
        watch.oldVocabulary=VOCABULARY;state.screen='spectating';game.onlineMode=false;game.mode='pvp';game.state='playing';
        pollSpectator();
      }
      async function pollSpectator(){
        if(!watch.active||watch.inFlight)return;
        watch.inFlight=true;const gen=watch.generation;
        try{
          const r=await RibbitCloud.spectateRoom({spectatorVersion:1,roomCode:watch.code,viewerToken:watch.token,epoch:watch.epoch,matchId:watch.matchId,cursor:watch.cursor});
          if(gen!==watch.generation)return;if(!r?.ok)throw new Error(r?.message||'Replay unavailable.');
          watch.token=r.viewerToken||watch.token;watch.ended=!!r.ended;
          if(r.matchId&&(r.matchId!==watch.matchId||r.epoch!==watch.epoch)){
            watch.matchId=r.matchId;watch.epoch=r.epoch;watch.cursor=-1;watch.frames=[];watch.playT=null;watch.meta=r.meta;
            if(r.meta){VOCABULARY=normalizeVocabularyEntries(r.meta.vocabulary);window.RibbitOnlineAppearanceOverrides=r.meta.appearances;}
          }
          for(const f of r.frames||[])if(f.q>watch.cursor){watch.frames.push(f);watch.cursor=f.q;}
          if(watch.frames.length>200)watch.frames.splice(0,watch.frames.length-200);
          if(watch.playT===null&&watch.frames.length)watch.playT=watch.frames[0].t;
          watch.error='';watch.message=r.waiting?'BUFFERING RECORDED FRAMES':'DELAYED REPLAY';
        }catch(e){if(gen===watch.generation){watch.error=String(e.message||e).slice(0,90);watch.message='REPLAY CONNECTION RETRY';}}
        finally{if(gen===watch.generation){watch.inFlight=false;watch.nextPollAt=now()+1200;}}
      }
      function stopSpectating(){
        watch.generation++;watch.active=false;watch.frames=[];watch.meta=null;watch.playT=null;watch.inFlight=false;watch.token='';
        if(watch.oldVocabulary){VOCABULARY=watch.oldVocabulary;watch.oldVocabulary=null;}
        window.RibbitOnlineAppearanceOverrides=null;game.onlineMode=false;game.onlinePredicting=false;game.pvpCriticalCatchActive=false;
        game.achievementToastTimer=0;state.screen='entry';game.state='onlineConnect';game.mode='pvp';state.focus='spectate';
      }
      function updateSpectator(dt){
        if(!watch.active||!watch.frames.length||watch.playT===null)return;
        const latest=watch.frames[watch.frames.length-1];
        if(!watch.paused)watch.playT=Math.min(latest.t,watch.playT+dt*1000);
        let a=watch.frames[0],b=null;
        for(const f of watch.frames){if(f.t<=watch.playT)a=f;else{b=f;break;}}
        if(a.t>watch.playT)watch.playT=a.t;
        const same=b&&b.s===a.s&&b.l===a.l&&b.g[3]===a.g[3]&&b.g[9]===a.g[9];
        const u=same?clamp((watch.playT-a.t)/Math.max(1,b.t-a.t),0,1):0;
        const g=a.g.slice();if(same){for(const k of [0,1,2,16])g[k]=lerp(a.g[k],b.g[k],u);}
        if(game.selectedLevelId!==a.l){game.selectedLevelId=a.l;applySelectedLevel();}
        game.state=a.s;game.mode='pvp';game.worldTime=g[0];game.elapsed=game.pvpElapsed=g[1];game.pvpTimeRemaining=g[2];
        game.pvpRoundNumber=g[3];game.pvpRoundWins=[g[4],g[5]];game.pvpWinnerIndex=g[6]<0?null:g[6];game.pvpMatchWinnerIndex=g[7]<0?null:g[7];
        game.pvpWinPendingIndex=g[8]<0?null:g[8];game.pvpSuddenDeath=!!g[9];game.pvpSuddenDeathScores=[g[10],g[11]];
        game.targetVocabIndex=g[12]<0?null:g[12];game.promptSerial=g[13];game.countdownNumber=g[14];
        game.pvpCriticalCatchActive=!!g[15];game.pvpCriticalCatchElapsed=g[16];game.pvpCriticalCatchDuration=2;game.pvpCriticalCatchWinnerIndex=g[17]<0?null:g[17];
        game.timeOfDay=TIME_OF_DAY_OPTIONS[g[18]]||'afternoon';game.moonPhaseIndex=g[19];game.pvpFinalDisplayTime=g[20]<0?null:g[20];
        game.pvpTimeLimitSeconds=g[21];game.pvpRoundGoalMode=g[22]?'endless':'firstto';game.pvpFirstTo=g[23];game.pvpBestOf=g[24];game.pvpCpuEnabled=false;
        setPlatformsToClock();
        a.p.forEach((raw,i)=>{
          const d=raw.slice(),next=same?b.p[i]:null,p=pvpPlayers[i];
          if(next){for(const k of [0,1,2,3,7,11,13,14])d[k]=lerp(raw[k],next[k],u);
            if(d[23]===next[23]&&d[24]===next[24]&&d[17]&&next[17])d[18]=lerp(raw[18],next[18],u);}
          Object.assign(p,{x:d[0],y:d[1],vx:d[2],vy:d[3],dir:d[4]||1,grounded:!!d[5],charging:!!d[6],charge:d[7],bonked:!!d[8],stunTimer:d[9],score:d[10],
            landingSquash:d[11],blinking:!!d[12],catchSparkleTimer:d[13],wrongCatchBubbleTimer:d[14],lastLaunchPower:d[15],streakTimer:0,airTime:d[25]||0,
            firstJumpMade:true,afterimages:[],skinId:watch.meta?.skins?.[i]||(i?'crimson':'azure'),
            tongue:{active:!!d[17],elapsed:d[18],duration:d[19]||.24,targetX:d[20],targetY:d[21],captured:!!d[22],targetFlyId:d[23]}});
        });
        flies.length=0;for(const d of a.f){const next=same?b.f.find(f=>f[0]===d[0]):null;
          flies.push({id:d[0],baseX:d[1],baseY:d[2],x:next?lerp(d[3],next[3],u):d[3],y:next?lerp(d[4],next[4],u):d[4],vocabIndex:d[5],
            state:d[6]?'spitting':'active',spawnAge:d[7],phase:d[8],spitElapsed:d[9],spitDuration:d[10],spitDelay:d[11],spitOwnerIndex:d[12],pvpBlockedPromptSerials:[-1,-1]});}
        game.pvpImpactEffects=(a.fx||[]).map(d=>({type:REPLAY_EFFECTS[d[0]]||'bounce',x:d[1],y:d[2],elapsed:d[3],duration:d[4]||.4,
          palette:buildMixedPalette(getPvpSkinPalette(pvpPlayers[0].skinId),getPvpSkinPalette(pvpPlayers[1].skinId))}));
        while(watch.frames.length>2&&watch.frames[1].t<watch.playT-1000)watch.frames.shift();
      }
      function drawSpectator(){
        if(!watch.frames.length){drawPanel('SPECTATE');fitText(watch.error||'BUFFERING DELAYED REPLAY',240,130,370,.8);}
        else{
          ctx.save();if(game.pvpCriticalCatchActive)applyPvpCriticalCatchCamera();
          drawBackground();for(const q of platforms)drawPlatform(q);drawTimeOfDayWorldTint();
          for(const f of flies){
            drawFlySpawnSparks(f);
            drawFlyAt(f.x,f.y,getFlySpawnScale(f));
            if (!window.RibbitRaceFinalCatchLabelsGone) drawFlyNameTag(f);
          }
          pvpPlayers.forEach(drawPvpTongue);pvpPlayers.forEach(drawPvpPlayer);drawPvpImpactEffects();ctx.restore();drawPvpHud();
          if(game.state==='countdown')drawResumeCountdown();
          if(game.state==='won'||game.state==='pvpCelebration'){
            ctx.fillStyle='rgba(38,54,61,.88)';ctx.fillRect(105,88,270,38);
            const name=watch.meta?.names?.[game.pvpWinnerIndex??0]||'PLAYER';
            fitText(name+' WINS '+(game.pvpMatchWinnerIndex===null?'ROUND':'MATCH'),240,99,252,1,'#f7fdff');
          }
        }
        const r=WATCH_UI.exit;ctx.fillStyle='#26363d';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#f7fdff';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);
        drawBitmapText('X',r.x+r.w/2,r.y+5,1.2,'center','#07516a');
        ctx.fillStyle='#26363d';ctx.fillRect(8,234,464,12);
        fitText(`REPLAY - ${watch.code} - ${watch.paused?'PAUSED':watch.ended?'RECORDING ENDED':'DELAYED VIEW'} - ESC TO LEAVE`,240,237,450,.52,'#f7fdff');
      }
      function drawWatchList(){
        drawPanel('SPECTATE');fitText(watch.error||watch.message,240,65,374,.7,watch.error?'#96334c':'#174f65');
        for(const b of onlineButtons())if(b.id!=='watchCode')drawOnlineAction(b,state.focus===b.id);
        const r=WATCH_UI.code;ctx.fillStyle=watch.codeFocus?COLORS.ink:'#9aa9ae';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#f7fdff';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);
        fitText(watch.code?'ROOM ID: '+watch.code:'TYPE ROOM ID',r.x+r.w/2,r.y+(r.h-6)/2,r.w-12,.85,'#174f65');
      }
      function watchKey(e){
        if(!watch.active&&state.screen!=='spectateList')return false;
        e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;
        if(watch.active){if(e.code==='Escape')stopSpectating();else if(e.code==='Space')watch.paused=!watch.paused;return true;}
        if(e.code==='Escape'){watch.generation++;state.screen='entry';return true;}
        if(e.code==='Backspace'){watch.code=watch.code.slice(0,-1);return true;}
        if(/^[a-z2-9]$/i.test(e.key)&&watch.code.length<5){watch.code+=e.key.toUpperCase();watch.codeFocus=true;}
        if(e.code==='Enter'||e.code==='NumpadEnter')startSpectating(watch.code);
        return true;
      }
      function watchPointer(p){
        if(watch.active){if(pointInsideRect(p,WATCH_UI.exit))stopSpectating();return true;}
        if(state.screen!=='spectateList')return false;
        for(let i=0;i<Math.min(4,watch.rooms.length);i++)if(pointInsideRect(p,{x:65,y:84+i*26,w:348,h:22})){startSpectating(watch.rooms[i].roomCode);return true;}
        if(pointInsideRect(p,WATCH_UI.code))watch.codeFocus=true;
        else if(pointInsideRect(p,WATCH_UI.go))startSpectating(watch.code);
        else if(pointInsideRect(p,WATCH_UI.back)){watch.generation++;state.screen='entry';}
        return true;
      }

      const onlineIdentity={sessionGeneration:-1,name:'',loaded:false,loading:null,draft:'',message:'',error:false,saving:false,returnScreen:'entry',tag:''};
      const battleView={entries:[],page:0,loading:false,error:'',guest:false,tag:'',generation:0};
      // Keep the original ONLINE card geometry while using the requested order:
      // Quickplay/Spectate, Host/Join, Customizer/Frog Tags.
      const ONLINE_HUB=[
        {id:'quick',label:'QUICKPLAY',x:66,y:100,w:163,h:29,icon:'quick',stripe:'#7fe3ae',tip:'Choose a frog, then find a similarly skilled opponent.'},
        {id:'host',label:'HOST',x:251,y:100,w:163,h:29,icon:'host',stripe:'#5ce5e8',tip:'Create a private room and share its five-character ID.'},
        {id:'join',label:'JOIN',x:66,y:142,w:163,h:29,icon:'join',stripe:'#ef7582',tip:'Join a friend using their room ID.'},
        {id:'spectate',label:'SPECTATE',x:251,y:142,w:163,h:29,icon:'eye',stripe:'#a68be5',tip:'Watch delayed recorded frames without joining a player connection.'},
        {id:'profile',label:'CUSTOMIZER',x:66,y:184,w:163,h:29,icon:'palette',stripe:'#ef9ebc',tip:'Edit the display name opponents see. Your Friends account is unchanged.'},
        {id:'battle',label:'FROG TAGS',x:251,y:184,w:163,h:29,icon:'tags',stripe:'#eac65b',tip:'View completed Quickplay encounters and your head-to-head record.'},
        {id:'back',label:'BACK',x:184,y:231,w:112,h:23,icon:'back',stripe:'#b2c6cd',tip:'Return to Local Versus.'}
      ];
      const PROFILE_UI={name:{x:108,y:112,w:264,h:31},save:{x:127,y:193,w:104,h:29},back:{x:250,y:193,w:104,h:29}};
      function onlineName(){return (onlineIdentity.sessionGeneration===profile().sessionGeneration?onlineIdentity.name:'')||compactPlayerName(profile().name||'GUEST');}
      async function loadOnlineIdentity(){
              const generation=profile().sessionGeneration;
              if(onlineIdentity.sessionGeneration!==generation){
                Object.assign(onlineIdentity,{sessionGeneration:generation,name:'',tag:'',loaded:false,loading:null,message:'',error:false,saving:false});
                battleView.entries=[];battleView.generation++;
              }
              if(onlineIdentity.loaded)return;
              if(onlineIdentity.loading)return onlineIdentity.loading;
              onlineIdentity.loading=RibbitCloud.onlineProfile().then(r=>{
                if(generation!==profile().sessionGeneration)return;
                if(!r?.ok)throw new Error(r?.message||'Online profile unavailable.');
                onlineIdentity.name=r.name;onlineIdentity.tag=r.battleTag||'';onlineIdentity.loaded=true;
                if(state.screen==='profile'&&!onlineIdentity.draft)onlineIdentity.draft=r.name;
              }).catch(e=>{if(generation===profile().sessionGeneration){onlineIdentity.message=String(e.message||e);onlineIdentity.error=true;}})
                .finally(()=>{if(generation===profile().sessionGeneration)onlineIdentity.loading=null;});
              return onlineIdentity.loading;
            }
      function cleanOnlineName(name){return String(name||'').normalize('NFC').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 _.'’-]/g,'').slice(0,20);}
      function openOnlineCustomizer(){
        if(state.active)return;
        onlineIdentity.returnScreen=state.connected?'room':'entry';onlineIdentity.draft=onlineName();onlineIdentity.message='';onlineIdentity.error=false;
        if(state.connected){state.localReady=false;state.lobbyRevision++;scheduleExchange(0);}
        state.screen='profile';state.focus='name';state.codeFocused=false;game.state='onlineConnect';loadOnlineIdentity();
      }
      async function saveOnlineCustomizer(){
        if(onlineIdentity.saving)return;
        const name=cleanOnlineName(onlineIdentity.draft).trim();
        if(!name){onlineIdentity.message='ENTER A DISPLAY NAME';onlineIdentity.error=true;return;}
        onlineIdentity.saving=true;onlineIdentity.message='SAVING NAME';onlineIdentity.error=false;
        try{const r=await RibbitCloud.onlineProfile({name});if(!r?.ok)throw new Error(r?.message||'Name could not be saved.');
          onlineIdentity.name=r.name;onlineIdentity.draft=r.name;onlineIdentity.tag=r.battleTag;onlineIdentity.loaded=true;
          state.localName=r.name;state.localNameShort=r.name.toUpperCase();state.lobbyRevision++;state.localReady=false;
          onlineIdentity.message='DISPLAY NAME SAVED';if(state.connected)scheduleExchange(0);tone(610,.07,.012,75);
        }catch(e){onlineIdentity.message=String(e.message||e);onlineIdentity.error=true;}
        finally{onlineIdentity.saving=false;}
      }
      function closeOnlineCustomizer(){
        state.screen=state.connected?'room':'entry';state.focus=state.connected?'myFrog':'profile';game.state=state.connected?'onlineSetup':'onlineConnect';
      }
      async function openBattleTags(){
        if(state.connected||state.active)return;
        state.screen='battleTags';state.focus='back';game.state='onlineConnect';battleView.loading=true;battleView.error='';battleView.page=0;
        battleView.entries=[];
        const gen=++battleView.generation;
        try{const r=await RibbitCloud.battleTags();if(gen!==battleView.generation)return;if(!r?.ok)throw new Error(r?.message||'Frog Tags unavailable.');
          battleView.entries=r.entries||[];battleView.guest=!!r.guest;battleView.tag=r.battleTag||'';
        }catch(e){if(gen===battleView.generation)battleView.error=String(e.message||e);}
        finally{if(gen===battleView.generation)battleView.loading=false;}
      }
      function drawOnlineIcon(kind,x,y,color='#174f65'){
        const rect=(a,b,w,h,c=color)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
        if(kind==='eye'){rect(-7,-2,2,4);rect(5,-2,2,4);rect(-5,-4,10,2);rect(-5,2,10,2);rect(-2,-2,4,4);rect(-1,-2,1,1,'#fff');}
        else if(kind==='quick'){rect(0,-7,5,3);rect(-2,-4,5,3);rect(-4,-1,9,3);rect(0,2,3,3);rect(-2,5,3,2);}
        else if(kind==='host'){rect(-6,1,12,5);rect(-3,-2,6,3);rect(-1,-7,2,8);rect(-4,-5,8,2);rect(-2,3,4,2,'#f7fdff');}
        else if(kind==='join'){rect(2,-6,5,12);rect(3,-4,3,8,'#f7fdff');rect(-7,-1,10,2);rect(-1,-4,2,8);rect(1,-2,2,4);}
        else if(kind==='tags'){rect(-7,-5,6,10);rect(1,-3,6,10);rect(-5,-3,2,2,'#f7fdff');rect(3,-1,2,2,'#f7fdff');rect(-5,-8,1,4);rect(3,-6,1,4);}
        else if(kind==='palette'){rect(-6,-4,12,8);rect(-4,-6,8,12);rect(2,2,4,4,'#f7fdff');rect(-3,-3,2,2,'#ef7582');rect(1,-3,2,2,'#d1d951');rect(-3,1,2,2,'#5ce5e8');}
        else if(kind==='home'){rect(-6,-1,12,8);rect(-4,-4,8,3);rect(-2,-6,4,2);rect(-2,2,4,5,'#f7fdff');}
        else if(kind==='play'){rect(-4,-6,3,12);rect(-1,-4,3,8);rect(2,-2,3,4);}
        else if(kind==='cancel'){for(let i=-4;i<=4;i+=2){rect(i,i,2,2);rect(i,-i,2,2);}}
        else if(kind==='save'){rect(-6,-6,12,12);rect(-3,-4,6,3,'#f7fdff');rect(-3,1,6,5,'#f7fdff');}
        else if(kind==='next'){rect(-4,-2,6,4);rect(1,-5,2,10);rect(3,-3,2,6);rect(5,-1,2,2);}
        else if(kind==='back'||kind==='previous'){rect(-2,-2,7,4);rect(-3,-5,2,10);rect(-5,-3,2,6);rect(-7,-1,2,2);}
        else if(kind==='gear'){rect(-5,-5,10,10);rect(-2,-7,4,14);rect(-7,-2,14,4);rect(-2,-2,4,4,'#f7fdff');}
        else if(kind==='sun'){rect(-3,-3,6,6);rect(-1,-7,2,3);rect(-1,4,2,3);rect(-7,-1,3,2);rect(4,-1,3,2);}
        else if(kind==='wifi')drawMiniWifiIcon(x,y,color);
        else if(kind==='frog')drawMiniFrogSwatchFacing(x,y-5,getPvpSkinPalette(state.localSkinId,'azure'),.7,1);
      }
      function drawOnlineAction(spec,focused=false){
        if (!state.keyboardFocus && state.hoverId) focused = spec.id === state.hoverId;
        const {x,y,w,h}=spec,palette=spec.palette||PVP_NEUTRAL_PALETTE,hasSub=!!spec.subLabel;
        ctx.save();ctx.fillStyle='rgba(25,43,52,.22)';ctx.fillRect(x+2,y+2,w,h);
        ctx.fillStyle=focused?COLORS.ink:'#9aa9ae';ctx.fillRect(x,y,w,h);
        ctx.fillStyle=focused?'#e8faf4':'#f7fdff';ctx.fillRect(x+2,y+2,w-4,h-4);
        ctx.fillStyle=focused?(spec.stripe||palette.light||'#5ce5e8'):'#ffffff';ctx.fillRect(x+5,y+4,w-10,2);
        const contentTop=y+8,contentBottom=y+h-3,cy=(contentTop+contentBottom)/2;
        const iconY=hasSub?y+h/2:cy;
        if(spec.icon)drawOnlineIcon(spec.icon,x+(spec.label?13:w/2),iconY,focused?'#07516a':'#48555a');
        if(spec.label){const left=x+(spec.icon?25:7),right=x+w-7;
          if(hasSub){
            const scale=Math.min(.76,(right-left)/Math.max(1,measureBitmapText(spec.label,1)));
            const subScale=Math.min(.39,(right-left)/Math.max(1,measureBitmapText(spec.subLabel,1)));
            const mainHeight=7*scale,subHeight=7*subScale,gap=2.5;
            const groupTop=y+(h-(mainHeight+gap+subHeight))/2;
            drawBitmapText(spec.label,(left+right)/2,groupTop,scale,'center',focused?'#07516a':'#48555a');
            drawBitmapText(spec.subLabel,(left+right)/2,groupTop+mainHeight+gap,subScale,'center',focused?'#07516a':'#59666b');
          }else{
            const scale=Math.min(h>25?1.00:.80,(right-left)/Math.max(1,measureBitmapText(spec.label,1)));
            drawBitmapText(spec.label,(left+right)/2,cy-7*scale/2,scale,'center',focused?'#07516a':'#48555a');
          }}
        ctx.restore();
      }
      function onlineButtons(){
        const spec=(id,label,r,icon,stripe='#5ce5e8',tip='',subLabel='')=>({id,label,...r,icon,stripe,tip,subLabel});
        if(state.screen==='directBlocked')return [
          spec('directRetry','TRY AGAIN',{x:67,y:193,w:163,h:28},'quick','#7fe3ae','Retry the direct connection check.'),
          spec('directLocal','LOCAL PLAY',{x:250,y:193,w:163,h:28},'home','#5ce5e8','Return to local play.'),
          spec('directOnline','ONLINE MENU',{x:165,y:231,w:150,h:23},'back','#bac8cf','Return to the online menu.')];
        if(state.screen==='entry')return ONLINE_HUB;
        if(state.screen==='join')return [spec('host','HOST',ENTRY.host,'host','#5ce5e8','Create your own room instead.'),spec('join','JOIN',ENTRY.join,'join','#ef7582','Enter the room ID below.'),
          spec('code','',ENTRY.code,null,'#ef7582','Type or paste the five-character room ID.'),spec('connect',state.busy?'CONNECTING':'JOIN ROOM',ENTRY.connect,'join','#ef7582','Connect to this room.'),spec('back','BACK',ENTRY.back,'back','#bac8cf','Return to Online.')];
        if(state.screen==='quickSelect')return [spec('quickFrog','',QUICK_UI.preview,null,'#5ce5e8','Left and right change your selected frog.'),
          spec('quickEnter',state.busy?'CHECKING DEVICE':'FIND MATCH',QUICK_UI.enter,'quick','#7fe3ae','60-second Endless, best of three, random stages.'),spec('quickCancel','BACK',QUICK_UI.cancel,'back','#bac8cf','Return to Online.')];
        if(state.screen==='quickQueue')return [spec('quickMinimize','PLAY WHILE WAITING',QUICK_UI.minimize,'play','#7fe3ae','Keep searching while you play solo or customize frogs.','DEVICE CHECK PASSED - PARTNER LINK NOT YET TESTED'),spec('quickCancel','CANCEL',QUICK_UI.cancel,'cancel','#ef7582','Leave the queue.')];
        if(state.screen==='quickConnecting')return [spec('back','CANCEL',ENTRY.back,'back','#bac8cf','Cancel this connection.')];
        if(state.screen==='profile')return [spec('name','',PROFILE_UI.name,null,'#ef9ebc','Type a display name, up to 20 characters.'),spec('nameSave',onlineIdentity.saving?'SAVING':'SAVE',PROFILE_UI.save,'save','#7fe3ae','Save this online name without changing your Friends account.'),spec('nameBack','BACK',PROFILE_UI.back,'back','#bac8cf','Return to Online.')];
        if(state.screen==='battleTags')return [spec('battlePrev','',{x:354,y:232,w:23,h:22},'previous','#eac65b','Previous opponents.'),spec('battleNext','',{x:384,y:232,w:23,h:22},'next','#eac65b','More opponents.'),spec('back','BACK',ENTRY.back,'back','#bac8cf','Return to Online.')];
        if(state.screen==='spectateList')return watch.rooms.slice(0,4).map((r,i)=>spec('watch:'+i,`${(r.names||[]).join(' VS ')} - ${r.roomCode}`,{x:65,y:88+i*24,w:348,h:21},'eye','#a68be5','Watch a delayed, read-only recording.')).concat([
          spec('watchCode','',WATCH_UI.code,null,'#a68be5','Type a five-character room ID.'),spec('watchGo','WATCH',WATCH_UI.go,'eye','#a68be5','Open this room recording.'),spec('back','BACK',WATCH_UI.back,'back','#bac8cf','Return to Online.')]);
        if(state.screen==='room'){
          const arr=[spec('myFrog','',localIndex()?PVP_SETUP_UI.p2Selector:PVP_SETUP_UI.p1Selector,null,'#5ce5e8','Left and right change your frog.'),
            spec('ready',!directReady()?'CHECKING LINK':state.localReady?'NOT READY':'READY',PVP_SETUP_UI.startButton,'play','#7fe3ae','The match starts when both players are ready.'),
            spec('leave','LEAVE',PVP_SETUP_UI.backButton,'home','#ef7582','Leave this private room.'),spec('profile','',{x:67,y:225,w:24,h:24},'palette','#ef9ebc','Edit your online display name.')];
          if(state.role==='host')arr.push(...PVP_SETUP_UI.levelButtons.map((r,i)=>spec('stage:'+i,r.id.toUpperCase(),r,null,'#5ce5e8','Choose the stage for this private match.')),
            spec('settings','',PVP_SETUP_UI.settingsButton,'gear','#bac8cf','Host-only match settings.'),spec('time','',PVP_SETUP_UI.timeButton,'sun','#eac65b','Change the time of day.'));
          return arr;
        }
        return [];
      }
      function focusOnlineButton(id){
        state.focus=id;state.codeFocused=id==='code';watch.codeFocus=id==='watchCode';state.keyboardFocus=true;
        if(state.screen==='room'){
          game.pvpSetupMouseMode=false;game.pvpSetupFocusArea=id==='myFrog'?'skin':id.startsWith('stage:')?'level':'bottom';
          if(id==='myFrog')game.pvpSetupPlayerIndex=localIndex();
          else if(id.startsWith('stage:'))game.pvpSetupLevelIndex=Number(id.split(':')[1]);
          else game.pvpSetupBottomSelection=({ready:'start',leave:'back'})[id]||id;
        }
      }
      function moveOnlineFocus(dx,dy,tab=false){
        const list=onlineButtons();if(!list.length)return;
        const at=list.findIndex(b=>b.id===state.focus),current=list[at<0?0:at];
        if(tab){focusOnlineButton(list[((at<0?0:at)+(dx<0?-1:1)+list.length)%list.length].id);return;}
        const cx=current.x+current.w/2,cy=current.y+current.h/2;
        let candidates=list.filter(b=>b!==current).map(b=>({b,x:b.x+b.w/2-cx,y:b.y+b.h/2-cy}));
        const front=candidates.filter(v=>dx?v.x*dx>2:v.y*dy>2);
        if(front.length){front.sort((a,b)=>{const score=v=>Math.abs(dx?v.x:v.y)+Math.abs(dx?v.y:v.x)*2.6;return score(a)-score(b);});focusOnlineButton(front[0].b.id);}
        else{candidates.sort((a,b)=>dx?(dx*(a.b.x-b.b.x)||Math.abs(a.y)-Math.abs(b.y)):(dy*(a.b.y-b.b.y)||Math.abs(a.x)-Math.abs(b.x)));if(candidates[0])focusOnlineButton(candidates[0].b.id);}
        tone(430,.035,.008,25);
      }
      function activateOnlineButton(id){
        if(id.startsWith('direct')){directFailureAction(id);return;}
        if(state.busy&&!['back','quickCancel'].includes(id))return;
        if(state.busy&&['back','quickCancel'].includes(id)){
          cancelDirectPreflight();state.generation++;quick.generation++;state.busy=false;
        }
        if(id==='quick')openQuickplay();else if(id==='host')createRoom();else if(id==='join')showJoin();
        else if(id==='spectate')openSpectate();else if(id==='profile')openOnlineCustomizer();else if(id==='battle')openBattleTags();
        else if(id==='code'||id==='name'||id==='watchCode')focusOnlineButton(id);
        else if(id==='connect')joinRoom();else if(id==='quickEnter')enterQuickplay();else if(id==='quickCancel')cancelQuickplay();else if(id==='quickMinimize')minimizeQueue();
        else if(id==='nameSave')saveOnlineCustomizer();else if(id==='nameBack')closeOnlineCustomizer();
        else if(id==='battlePrev'||id==='battleNext'){const pages=Math.max(1,Math.ceil(battleView.entries.length/6));battleView.page=(battleView.page+(id==='battlePrev'?-1:1)+pages)%pages;}
        else if(id.startsWith('watch:'))startSpectating(watch.rooms[Number(id.split(':')[1])]?.roomCode);
        else if(id==='watchGo')startSpectating(watch.code);
        else if(id==='myFrog')cycleSkin(1);else if(id==='ready')setReady();else if(id==='leave')leaveRoom();
        else if(id==='settings')openSettings();else if(id==='time'){cycleTimeOfDayMode();settingsChanged();}
        else if(id.startsWith('stage:')){selectPvpSetupLevel(Number(id.split(':')[1]));settingsChanged();}
        else if(id==='back'){
          if(state.screen==='entry')closeOverlay();else if(state.screen==='quickConnecting')leaveRoom();
          else if(state.screen==='directBlocked')directFailureAction('directOnline');
          else if(state.screen==='profile')closeOnlineCustomizer();else {watch.generation++;battleView.generation++;state.screen='entry';state.focus='quick';state.codeFocused=false;watch.codeFocus=false;setStatus('');}
        }
      }
      function drawOnlineLegacyAction(rect,label,selected,palette){
        const match=onlineButtons().find(b=>b.x===rect.x&&b.y===rect.y&&b.w===rect.w);
        const text=String(label||'');
        const icon=match?.icon||( /BACK|LEAVE|HOME/.test(text)?'home':/CANCEL/.test(text)?'cancel':/WATCH/.test(text)?'eye':/READY|START|FIND|WAITING/.test(text)?'play':'gear');
        drawOnlineAction({...rect,id:match?.id,label:text,icon,stripe:match?.stripe||palette?.light||'#5ce5e8',subLabel:match?.subLabel||''},selected||state.focus===match?.id);
      }
      function drawOnlineTooltip(){
              if(!isMenuVisible()||state.screen==='quickConnecting')return;
              let b=onlineButtons().find(v=>v.id===(state.keyboardFocus?state.focus:(state.hoverId||state.focus)));
              if(state.screen==='settings'){
                const tips=['Choose First to 5, First to 10, or Endless.','Choose the round timer.','Choose how many rounds make a match.','Local-mode resume countdown. Online play never pauses.','Return to the room without showing settings to your opponent.'];
                const index=Math.max(0,Math.min(4,game.pvpSettingsFocusIndex||0));
                b={x:190,w:100,tip:tips[index]};
              }
              if(!b?.tip)return;
              let r;
              if(['entry','join'].includes(state.screen))r={x:52,y:75,w:376,h:19};
              else if(['room','settings','spectateList'].includes(state.screen))r={x:52,y:60,w:376,h:19};
              else if(['quickSelect','quickQueue'].includes(state.screen))r={x:40,y:120,w:101,h:52};
              else if(state.screen==='profile')r={x:65,y:86,w:350,h:18};
              else if(state.screen==='battleTags')r={x:65,y:207,w:350,h:20};
              if(!r)return;
              const narrow=r.w<150,scale=narrow?.57:.58,lines=[];
              if(narrow){let line='';for(const word of b.tip.toUpperCase().split(/\s+/)){const next=line?line+' '+word:word;if(measureBitmapText(next,scale)>r.w-12&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}
              else lines.push(b.tip);
              ctx.save();ctx.fillStyle='rgba(25,43,52,.18)';ctx.fillRect(r.x+2,r.y+2,r.w,r.h);
              ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#ffffff';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);
              const top=r.y+(r.h-(lines.length*7*scale+(lines.length-1)*3))/2;
              lines.slice(0,5).forEach((line,i)=>fitText(line,r.x+r.w/2,top+i*(7*scale+3),r.w-12,scale,'#48555a'));
              ctx.fillStyle=COLORS.ink;
              if(narrow){ctx.fillRect(r.x+r.w,r.y+22,4,7);ctx.fillRect(r.x+r.w+4,r.y+24,3,3);}
              else{const px=clamp(b.x+b.w/2,r.x+10,r.x+r.w-10);ctx.fillRect(px-3,r.y+r.h,6,3);ctx.fillRect(px-1,r.y+r.h+3,2,2);}
              ctx.restore();
            }
      function drawOnlineProfile(){
        drawPanel('CUSTOMIZER');fitText('YOUR ONLINE DISPLAY NAME',240,67,375,.9,'#07516a');
        const r=PROFILE_UI.name;ctx.fillStyle=state.focus==='name'?COLORS.ink:'#9aa9ae';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#fff';ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
        fitText(onlineIdentity.draft||'TYPE YOUR NAME',240,r.y+12,r.w-16,1.15,onlineIdentity.draft?'#174f65':'#85969c');
        if(state.focus==='name'&&Math.floor(game.visualTime*2)%2===0){const width=measureBitmapText(onlineIdentity.draft,Math.min(1.15,(r.w-16)/Math.max(1,measureBitmapText(onlineIdentity.draft,1))));ctx.fillStyle='#174f65';ctx.fillRect(Math.min(r.x+r.w-8,240+width/2+3),r.y+11,1,10);}
        fitText('YOUR ROSTER NAME AND PLAYER ID DO NOT CHANGE',240,158,374,.62);
        fitText(onlineIdentity.message||(profile().guestMode?"":'THIS NAME IS SAVED TO YOUR ONLINE PROFILE'),240,174,374,.58,onlineIdentity.error?'#96334c':'#59666b');
        for(const b of onlineButtons())if(b.id!=='name')drawOnlineAction(b,state.focus===b.id);
        if(onlineIdentity.tag)fitText('BATTLE TAG: '+onlineIdentity.tag,240,239,300,.63);
      }
      function drawBattleTags(){
        drawPanel('FROG TAGS');fitText(battleView.loading?'LOADING MATCH RECORDS':battleView.error||'YOUR QUICKPLAY HEAD-TO-HEAD RECORDS',240,67,376,.76,battleView.error?'#96334c':'#07516a');
        const xs=[79,286,370];drawBitmapText((window.RibbitOpponentName?.() || "OPPONENT"),xs[0],88,.72,'left','#59666b');drawBitmapText('MATCHES',xs[1],88,.65,'center','#59666b');drawBitmapText('W - L',xs[2],88,.72,'center','#59666b');
        const entries=battleView.entries.slice(battleView.page*6,battleView.page*6+6);
        entries.forEach((r,i)=>{const y=102+i*18;ctx.fillStyle=i%2?'#e6f3f3':'#f0f7f8';ctx.fillRect(68,y-3,344,17);
          fitText(r.name+(r.temporary?' *':''),80,y+1,166,.78,'#174f65','left');drawBitmapText(String(r.matches),286,y+1,.78,'center','#48555a');drawBitmapText(`${r.wins} - ${r.losses}`,370,y+1,.78,'center','#07516a');});
        if(!entries.length&&!battleView.loading&&!battleView.error)fitText('NO COMPLETED QUICKPLAY MATCHES YET',240,146,350,.78);
        fitText(battleView.guest?'GUEST RECORDS ARE TEMPORARY':"",240,216,374,.53);
        for(const b of onlineButtons())drawOnlineAction(b,state.focus===b.id);
        fitText(`${battleView.page+1}/${Math.max(1,Math.ceil(battleView.entries.length/6))}`,337,240,29,.6);
      }
      function drawOnlineEntry(){
        if(state.screen==='directBlocked'){drawDirectBlocked();return;}
        if(['quickSelect','quickQueue','quickConnecting'].includes(state.screen)){drawQuickplayScreen();return;}
        if(state.screen==='profile'){drawOnlineProfile();return;}
        if(state.screen==='battleTags'){drawBattleTags();return;}
        if(state.screen==='spectateList'){drawWatchList();return;}
        drawPanel('ONLINE');drawQuickCounts(64);
        if(state.screen==='join'){
          const r=ENTRY.code;ctx.fillStyle=state.focus==='code'?COLORS.ink:'#9aa9ae';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#fff';ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
          const text=state.codeText.padEnd(5,'-'),scale=1.6;drawBitmapText(text,240,r.y+10,scale,'center','#174f65');
          if(state.codeFocused&&state.codeText.length<5&&Math.floor(game.visualTime*2)%2===0){const left=Math.round(240-measureBitmapText(text,scale)/2);const x=left+state.codeText.length*6*scale;ctx.fillStyle='#174f65';ctx.fillRect(x,r.y+18,5*scale,1.2);}
        }
        for(const b of onlineButtons())if(b.id!=='code')drawOnlineAction(b,state.focus===b.id);
        if(state.error||state.busy)fitText(state.message,240,state.screen==='entry'?220:213,384,.55,state.error?'#96334c':'#07516a');
      }
      function onlineMenuKey(e){
        if(watch.active){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(e.code==='Escape')stopSpectating();else if(e.code==='Space')watch.paused=!watch.paused;}return true;}
        if(!isMenuVisible())return false;
        if(e.ctrlKey||e.metaKey){
          if(e.code==='KeyV')return true;
          if(e.code==='KeyA'&&state.screen==='profile'&&state.focus==='name'){e.preventDefault();e.stopImmediatePropagation();onlineIdentity.selectAll=true;return true;}
          return false;
        }
        e.preventDefault();e.stopImmediatePropagation();const k=e.code;
        if(k==='Escape'){
          if(e.repeat)return true;
          if(state.screen==='settings')closeSettings();else if(state.screen==='room')leaveRoom();else if(state.screen==='quickQueue')minimizeQueue();
          else if(state.screen==='quickSelect')cancelQuickplay();else activateOnlineButton('back');return true;
        }
        if(state.screen==='profile'&&state.focus==='name'){
          if(k==='Backspace'||k==='Delete'){onlineIdentity.draft=onlineIdentity.selectAll?'':onlineIdentity.draft.slice(0,-1);onlineIdentity.selectAll=false;return true;}
          if(e.key?.length===1&&/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _.'’-]$/.test(e.key)){if(onlineIdentity.selectAll)onlineIdentity.draft='';onlineIdentity.selectAll=false;onlineIdentity.draft=cleanOnlineName(onlineIdentity.draft+e.key);return true;}
          if(['Enter','NumpadEnter'].includes(k)){saveOnlineCustomizer();focusOnlineButton('nameSave');return true;}
        }
        if((state.screen==='join'&&state.codeFocused)||(state.screen==='spectateList'&&watch.codeFocus)){
          const target=state.screen==='join'?state:watch,key=state.screen==='join'?'codeText':'code';
          if(k==='Backspace'){target[key]=target[key].slice(0,-1);return true;}
          if(e.key?.length===1&&/^[a-z2-9]$/i.test(e.key)){if(target[key].length<5)target[key]+=e.key.toUpperCase();return true;}
          if(['Enter','NumpadEnter'].includes(k)){if(state.screen==='join')joinRoom();else startSpectating(watch.code);return true;}
        }
        if(state.screen==='settings'){
          if(['ArrowUp','KeyW'].includes(k))movePvpSettingsFocus(0,-1);else if(['ArrowDown','KeyS'].includes(k))movePvpSettingsFocus(0,1);
          else if(['ArrowLeft','KeyA'].includes(k)){movePvpSettingsFocus(-1,0);settingsChanged();}else if(['ArrowRight','KeyD'].includes(k)){movePvpSettingsFocus(1,0);settingsChanged();}
          else if(['Enter','Space'].includes(k)){if(game.pvpSettingsFocusIndex===4)closeSettings();else{activatePvpSettingsSelection();settingsChanged();}}return true;
        }
        if(['quickFrog','myFrog'].includes(state.focus)&&['KeyA','ArrowLeft','KeyD','ArrowRight'].includes(k)){
          if(!e.repeat){if(state.screen==='quickSelect')quickCycleSkin(['KeyA','ArrowLeft'].includes(k)?-1:1);else cycleSkin(['KeyA','ArrowLeft'].includes(k)?-1:1);}return true;
        }
        if(e.repeat)return true;
        if(k==='Tab')moveOnlineFocus(e.shiftKey?-1:1,0,true);
        else if(['ArrowUp','KeyW'].includes(k))moveOnlineFocus(0,-1);else if(['ArrowDown','KeyS'].includes(k))moveOnlineFocus(0,1);
        else if(['ArrowLeft','KeyA'].includes(k))moveOnlineFocus(-1,0);else if(['ArrowRight','KeyD'].includes(k))moveOnlineFocus(1,0);
        else if(['Enter','NumpadEnter','Space'].includes(k))activateOnlineButton(state.focus);
        return true;
      }
      function onlinePointerDown(e){
        const p=getCanvasPoint(e);
        if(state.exitMenu&&state.active){e.preventDefault();e.stopImmediatePropagation();if(pointInsideRect(p,{x:118,y:152,w:114,h:29}))state.exitMenu=false;else if(pointInsideRect(p,{x:248,y:152,w:114,h:29}))leaveToHome();return true;}
        if(watch.active){e.preventDefault();e.stopImmediatePropagation();watchPointer(p);return true;}
        if(!isMenuVisible())return false;
        e.preventDefault();e.stopImmediatePropagation();canvas.focus({preventScroll:true});ensureAudio();
        if(state.screen==='settings'){
          const i=PVP_SETTINGS_UI.rows.findIndex(r=>pointInsideRect(p,r));if(i>=0){game.pvpSettingsFocusIndex=i;const r=PVP_SETTINGS_UI.rows[i];cyclePvpSetting(['roundGoal','time','bestOf','unpause'][i],p.x<r.x+r.w/2?-1:1);settingsChanged();}
          else if(pointInsideRect(p,PVP_SETTINGS_UI.backButton))closeSettings();return true;
        }
        const b=onlineButtons().find(b=>pointInsideRect(p,b));if(!b)return true;focusOnlineButton(b.id);
        if(b.id==='quickFrog'){quickCycleSkin(p.x<b.x+b.w/2?-1:1);return true;}
        if(b.id==='myFrog'){cycleSkin(p.x<b.x+b.w/2?-1:1);return true;}
        activateOnlineButton(b.id);return true;
      }
      function onlinePointerMove(e){
        if(state.exitMenu&&state.active){const p=getCanvasPoint(e);if(pointInsideRect(p,{x:118,y:152,w:114,h:29}))state.exitFocus='continue';else if(pointInsideRect(p,{x:248,y:152,w:114,h:29}))state.exitFocus='home';return true;}
        if(!isMenuVisible())return false;
        const p=getCanvasPoint(e);e.stopImmediatePropagation();state.keyboardFocus=false;
        if(state.screen==='settings'){const i=PVP_SETTINGS_UI.rows.findIndex(r=>pointInsideRect(p,r));if(i>=0)game.pvpSettingsFocusIndex=i;else if(pointInsideRect(p,PVP_SETTINGS_UI.backButton))game.pvpSettingsFocusIndex=4;return true;}
        const b=onlineButtons().find(b=>pointInsideRect(p,b));
        if(b){const editing=(state.screen==='profile'&&state.focus==='name')||(state.screen==='join'&&state.codeFocused)||(state.screen==='spectateList'&&watch.codeFocus);
          if(!editing||b.id==='name'||b.id==='code'||b.id==='watchCode')focusOnlineButton(b.id);
          state.hoverId=b.id;
        }else {state.hoverId='';if(!['name','code','watchCode'].includes(state.focus))state.focus='';}
        try{canvas.style.setProperty('cursor',b?'pointer':'default','important');}catch(_){ }
        state.keyboardFocus=false;return true;
      }
      const ENTRY={host:{x:115,y:100,w:116,h:30},join:{x:249,y:100,w:116,h:30},
        code:{x:151,y:132,w:178,h:33},connect:{x:151,y:179,w:178,h:26},back:{x:177,y:223,w:126,h:23}};
      function now(){return performance.now();}
      function commandId(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);}
      function profile(){return RibbitCloud.getProfile?.()||{};}
      function onlineAllowed(){const p=profile();return !!(p.signedIn||p.guestMode);}
      function compactPlayerName(raw,fallback='PLAYER'){
        const cleaned=String(raw||'').trim().replace(/\s+/g,' ');
        if(!cleaned)return fallback;
        const parts=cleaned.split(' ').filter(Boolean);
        const first=parts[0]||fallback;
        if(parts.length<=1)return first.slice(0,14).toUpperCase();
        const lastInitial=(parts[parts.length-1]||'').charAt(0);
        return `${first} ${lastInitial ? `${lastInitial}.` : ''}`.trim().slice(0,18).toUpperCase();
      }
      function isAuthority(){return state.role===(state.authorityRole||'host');}
      function recoverAuthoritativeWorld(snapshot){
        if(!snapshot||!Array.isArray(snapshot.players)||snapshot.players.length!==2)return false;
        if(LEVELS[snapshot.levelId]){game.selectedLevelId=snapshot.levelId;applySelectedLevel();}
        for(const k of GAME_FIELDS)if(Object.prototype.hasOwnProperty.call(snapshot.game||{},k))game[k]=snapshot.game[k];
        game.mode='pvp';game.onlineMode=true;game.onlineRole=state.role;
        if(Array.isArray(snapshot.platforms))snapshot.platforms.forEach((q,i)=>{if(platforms[i]){platforms[i].x=q.x;platforms[i].y=q.y;}});
        snapshot.players.forEach((data,i)=>{unpackPlayer(pvpPlayers[i],data);pvpPlayers[i].afterimages=[];});
        flies.length=0;for(const f of snapshot.flies||[])flies.push({...f});
        const sim=snapshot.simulation||{};
        game.spawnQueue=Array.isArray(sim.spawnQueue)?sim.spawnQueue.map(v=>({...v})):[];
        game.completedVocabIndices=new Set(sim.completedVocabIndices||[]);
        nextFlyId=Math.max(Number(sim.nextFlyId)||1,...flies.map(f=>Number(f.id)+1));
        game.lastFlySpawnIndex=Number.isInteger(sim.lastFlySpawnIndex)?sim.lastFlySpawnIndex:-1;
        game.lastFlySpawnTime=Number.isFinite(sim.lastFlySpawnTime)?sim.lastFlySpawnTime:game.elapsed-CONFIG.flySpawnMinimumSpacing;
        game.pvpImpactEffects=(snapshot.impacts||[]).map(e=>({...e}));
        for(const k of ['pvpBonkCounts','pvpRoundBonkCounts','pvpMatchBonkCounts','pvpSelfBonkCounts'])if(Array.isArray(sim[k]))game[k]=sim[k].slice();
        resetRoundNetwork(snapshot.roundKey||currentRoundKey());
        if(Array.isArray(snapshot.promptTargets))snapshot.promptTargets.forEach((v,i)=>{if(Number.isInteger(v))net.promptPlan[Number(snapshot.promptBase)+i]=v;});
        net.simClock=Number(snapshot.sampleClock)||0;
        if(!snapshot.simulation&&game.state==='playing'&&game.pvpWinPendingIndex===null&&!game.pvpTimerGraceActive){
          for(let i=flies.length;i<CONFIG.maxFlies;i++)game.spawnQueue.push({dueAt:game.elapsed+(i-flies.length)*CONFIG.flySpawnMinimumSpacing});
        }
        if(game.state==='playing'&&game.pvpWinPendingIndex===null&&!game.pvpTimerGraceActive&&!game.pvpTimedOutcomePending){
          ensureTargetVocabularyAvailable(game.targetVocabIndex);
        }
        return true;
      }
      function adoptAuthority(response){
        const version=Number(response.authorityVersion)||1;
        if(version<state.authorityVersion)return;
        const cpuIndex=Number.isInteger(response.cpuIndex)?response.cpuIndex:-1;
        const changing=version>state.authorityVersion||cpuIndex!==state.cpuIndex;
        if(!changing)return;
        const becameAuthority=response.authorityRole===state.role&&!isAuthority();
        state.authorityRole=response.authorityRole||'host';state.authorityVersion=version;state.cpuIndex=cpuIndex;
        if(cpuIndex<0)return;
        state.takeoverReason=response.takeover?.reason==='left'?'left':'disconnected';
        gate.expectedDeparture=false;gate.lossAt=0;gate.phase='local-cpu';
        closePeer();state.remoteConnected=false;state.remoteHeld=false;state.remoteReady=false;
        if(becameAuthority){
          const candidates=[response.recoverySnapshot,state.lastRecoverySnapshot].filter(s=>s&&s.matchId===state.resultMatchId);
          candidates.sort((a,b)=>(Number(b.sequence)||0)-(Number(a.sequence)||0));
          const source=candidates[0]||null; // Prefer the latest direct frame over an older audit copy.
          if(source)recoverAuthoritativeWorld(source);
          state.snapshotSequence=Math.max(Number(source?.sequence)||0,Number(response.snapshotSequence)||0)+1;
        }
        state.active=true;state.screen='match';state.starting=false;state.awaitingHostFrame=false;
        state.renderCorrections=[{x:0,y:0},{x:0,y:0}];state.pendingInputEvents=[];state.unacknowledgedInputs=[];
        net.pendingClaims=[];net.predictedCatches=[];net.predictionHold=false;net.finalSpeculated=false;net.remoteDisplay=null;net.remotePlay=null;net.localFlightSequence=0;
        game.onlineMode=true;game.onlineRole=state.role;game.onlineCpuIndex=cpuIndex;
        game.pvpCpuEnabled=true;game.pvpCpuDifficulty=5;game.pvpCpuPlan=null;game.pvpCpuDecisionTimer=0;
        const cpu=pvpPlayers[cpuIndex];cpu.inputHeld=false;cpu.charging=false;cpu.cpuHoldChargeTrap=false;cpu.cpuTrapBailUntil=-Infinity;cpu.lastHumanInputAt=-Infinity;
        if(game.state==='playing'){
          Object.assign(syncClock,{key:currentRoundKey(),loaded:true,complete:true,phase:'playing'});
          game.pvpCriticalCatchActive=false;
          if(game.pvpWinPendingIndex===null&&!game.pvpTimerGraceActive&&!game.pvpTimedOutcomePending){
            ensureTargetVocabularyAvailable(game.targetVocabIndex);
            if(!game.spawnQueue.length&&flies.length<CONFIG.maxFlies){
              for(let i=flies.length;i<CONFIG.maxFlies;i++)game.spawnQueue.push({dueAt:game.elapsed+(i-flies.length+1)*CONFIG.flySpawnMinimumSpacing});
            }
          }
        }else if(game.state==='countdown'){
          syncClock.loaded=true;syncClock.key=currentRoundKey();readStartSync(response.startSync);
        }
        state.takeoverNoticeUntil=now()+6500;
        setStatus(state.takeoverReason==='disconnected'?'PLAYER DISCONNECTED - CPU LEVEL 5 TAKES OVER':'PLAYER LEFT - CPU LEVEL 5 TAKES OVER');
        lastFrameTime=now();accumulator=0;startBackgroundClock();state.urgent=true;
      }
      function showExitMenu(){
        if(!state.active)return false;
        state.exitMenu=!state.exitMenu;state.exitFocus='continue';
        if(state.exitMenu)releaseHeldControl();
        return true;
      }
      async function sendLeaveRequest(req,attempt=0){
        try{const r=await RibbitCloud.leaveOnlineRoom(req);if(!r?.ok&&attempt<3)setTimeout(()=>sendLeaveRequest(req,attempt+1),300*(attempt+1));}
        catch(_){if(attempt<3)setTimeout(()=>sendLeaveRequest(req,attempt+1),500*(attempt+1));}
      }
      function leaveToHome(){
        const req={protocol:3,lifecycleVersion:3,roomCode:state.roomCode,playerToken:state.playerToken};
        if(state.connected){sendPeer('leaving',{role:state.role});sendLeaveRequest(req);}
        quick.suspendedActivity=null;quick.peekActivity=null;cleanup(false);state.exitMenu=false;openMainMenu();
      }
      function drawExitMenu(){
        if(!state.active||!state.exitMenu)return;
        ctx.save();ctx.fillStyle='rgba(14,31,40,.58)';ctx.fillRect(0,0,W,H);
        const r={x:104,y:75,w:272,h:128};ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);
        ctx.fillStyle='#f7fdff';ctx.fillRect(r.x+3,r.y+3,r.w-6,r.h-6);
        fitText('ONLINE MATCH',240,90,245,1.45,'#07516a');
        fitText('THE GAME IS STILL RUNNING',240,114,244,.78);
        fitText('A LEVEL 5 CPU TAKES OVER IF YOU LEAVE',240,129,250,.58);
        drawOnlineAction({id:'continue',label:'CONTINUE',x:118,y:152,w:114,h:29,icon:'play',stripe:'#5ce5e8'},state.exitFocus==='continue');
        drawOnlineAction({id:'home',label:'HOME MENU',x:248,y:152,w:114,h:29,icon:'home',stripe:'#ef7582'},state.exitFocus==='home');
        ctx.restore();
      }
      function exitMenuKey(e){
        if(!state.active)return false;
        if(e.code==='Escape'){
          e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)showExitMenu();return true;
        }
        if(!state.exitMenu)return false;
        e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return true;
        if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Tab'].includes(e.code))state.exitFocus=state.exitFocus==='continue'?'home':'continue';
        else if(['Enter','NumpadEnter','Space'].includes(e.code)){if(state.exitFocus==='home')leaveToHome();else state.exitMenu=false;}
        return true;
      }
      function preparingStart(){return state.active&&game.state==='countdown'&&!syncClock.complete&&(!['committed','playing'].includes(syncClock.phase)||serverNow()<syncClock.countdownAt);}
      function surfaceLockedDisplay(player){
        if(!player||player.bonked)return player;
        const shown={...player};
        if(shown.grounded){
          let best=null,distance=Infinity;
          for(const q of platforms){if(!horizontalOverlap(shown.x,shown.w,q))continue;const d=Math.abs(shown.y+shown.h-q.y);if(d<distance){distance=d;best=q;}}
          if(best&&distance<=5)shown.y=best.y-shown.h;
        }else if(shown.vy>=0&&shown.departurePlatform==null&&shown.dropThroughPlatform==null){
          // Clamp render-only extrapolation at the first surface below its previous feet.
          const prior=Number.isFinite(shown.previousY)?shown.previousY+shown.h:shown.y+shown.h;
          for(const q of platforms)if(horizontalOverlap(shown.x,shown.w,q)&&prior<=q.y+1.5&&shown.y+shown.h>=q.y){shown.y=Math.min(shown.y,q.y-shown.h);}
        }
        return shown;
      }
      function renderCorrectionFor(index){
        const c=state.renderCorrections[index]||{x:0,y:0};
        if(pvpPlayers[index]?.grounded)return {x:c.x,y:0};
        return c;
      }
      function localIndex(){return state.role==='guest'?1:0;}
      function roomPlayerLabel(playerIndex){
        if(playerIndex===localIndex())return state.localNameShort||compactPlayerName(profile().name||'PLAYER');
        if(playerIndex===state.cpuIndex)return 'CPU LV 5';
        if(!state.remoteConnected)return 'WAITING';
        return state.remoteNameShort||compactPlayerName(state.remoteName||'FRIEND','FRIEND');
      }
      function setStatus(message,error=false){state.message=String(message||'');state.error=!!error;}
      function isActive(){return state.active;}
      function isGuestActive(){return state.active&&!isAuthority();}
      function isHostActive(){return state.active&&isAuthority();}
      function isRoomMenu(){return state.connected&&!state.active&&state.screen==='room';}
      function isMenuVisible(){return ['entry','join','room','settings','quickSelect','quickQueue','quickConnecting','directBlocked','spectateList','profile','battleTags'].includes(state.screen)&&!state.active;}
      function hasRoom(){return state.connected;}
      function ownSettings(){return {
        stage:game.pvpSetupLevelId||'park',roundGoal:isPvpEndlessMode()?'endless':game.pvpFirstTo>=10?'first10':'first5',
        bestOf:game.pvpBestOf,timeLimit:game.pvpTimeLimitSeconds,timeOfDay:game.timeOfDayLock||'random',unpause:game.pvpUnpauseCountdown!==false
      };}
      function applySettings(settings){
        if(!settings)return;
        game.pvpSetupLevelId=settings.stage||'park';game.pvpSetupLevelIndex=Math.max(0,PVP_STAGE_ORDER.indexOf(game.pvpSetupLevelId));
        game.pvpRoundGoalMode=settings.roundGoal==='endless'?'endless':'firstto';game.pvpFirstTo=settings.roundGoal==='first10'?10:5;
        game.pvpBestOf=Number(settings.bestOf)||3;game.pvpTimeLimitSeconds=Number(settings.timeLimit)||0;
        game.timeOfDayLock=['afternoon','morning','night'].includes(settings.timeOfDay)?settings.timeOfDay:null;
        game.pvpUnpauseCountdown=settings.unpause!==false;
      }
      function appearanceFor(id){
        // Do not accidentally read the last remote override when cycling a local skin.
        const was=game.onlineMode;game.onlineMode=false;
        try{return {...getPvpSkinPalette(id,localIndex()?'crimson':'azure',localIndex())};}
        finally{game.onlineMode=was;}
      }
      function syncPreview(){
        if(!state.connected)return;
        const i=localIndex(),j=1-i;
        game.onlineMode=true;game.onlineRole=state.role;game.pvpCpuEnabled=false;
        game.pvpSetupSkinIds[i]=state.localSkinId;game.pvpSetupSkinIds[j]=state.remoteSkinId;
        game.pvpSetupSkinIndex=game.pvpSetupSkinIds.map(id=>Math.max(0,PVP_FROG_SKIN_ORDER.indexOf(id)));
        const a=[];a[i]=state.localAppearance;a[j]=state.remoteAppearance;
        window.RibbitOnlineAppearanceOverrides=a;
      }
      function open(){
        // Opening ONLINE always produces the real entry menu. A stale/background
        // Quickplay ticket used to leave quickSelect active behind the entry art,
        // so the buttons looked present but were routed to the wrong screen.
        if(!state.connected&&!state.active&&(quick.queued||quick.token||state.quickplay||['quickSelect','quickQueue','quickConnecting'].includes(state.screen))){
          cancelDirectPreflight();
          const staleToken=quick.token;
          quick.generation++;
          quick.token='';quick.pendingAction='';quick.queued=false;quick.background=false;quick.peekActivity=null;
          quick.error='';quick.message='';quick.rematch=false;quick.opponentRematch=false;quick.changingMatch=false;
          clearTimeout(quick.queueTimer);quick.queueTimer=null;
          if(staleToken)cancelQuickplayTicket(staleToken);
          RibbitCloud.setOnlineRealtimeActive?.(false);
        }
        if(state.connected){state.screen='room';game.state='onlineSetup';syncPreview();return;}
        if(!state.previousSetup){
          state.previousSetup={settings:ownSettings(),cpu:game.pvpCpuEnabled,skins:[...game.pvpSetupSkinIds],timeLock:game.timeOfDayLock};
        }
        watch.generation++;watch.active=false;watch.frames=[];watch.inFlight=false;
        state.exitMenu=false;state.hoverId='';state.keyboardFocus=false;
        state.localSkinId=normalizePvpSkinId(game.pvpSetupSkinIds?.[0],normalizePvpSkinId(game.skinId,'azure'));
        state.localAppearance=appearanceFor(state.localSkinId);state.settings=ownSettings();
        state.screen='entry';state.focus='quick';state.codeText='';state.codeFocused=false;state.busy=false;state.quickplay=false;
        game.state='onlineConnect';game.mode='pvp';game.onlineMode=false;
        setStatus(onlineAllowed()?'':'SIGN IN OR CHOOSE GUEST PLAY.',!onlineAllowed());
        quick.nextStatsAt=0;quick.error='';loadOnlineIdentity();
        canvas.focus({preventScroll:true});
      }
      function closeOverlay(){ // compatibility with the existing Escape routing; no overlay exists.
        if(['quickSelect','quickQueue'].includes(state.screen)){cancelQuickplay();return;}
        if(state.screen==='settings'){closeSettings();return;}
        if(state.connected){leaveRoom();return;}
        cleanup();
      }
      function showJoin(){state.screen='join';state.focus='code';state.codeFocused=true;setStatus('ENTER YOUR FRIEND\'S FIVE-CHARACTER ROOM CODE.');}
      async function createRoom(){
        if(state.busy||!onlineAllowed()){if(!onlineAllowed())setStatus('SIGN IN TO PLAY ONLINE.',true);return;}
        state.busy=true;gate.lastAttempt={kind:'host'};setStatus('CHECKING SERVER ACCESS...');const gen=++state.generation;
        try{
          await checkLocalDirectCapability();if(gen!==state.generation)return;
          setStatus('CREATING SERVER ROOM...');
          state.localAppearance=appearanceFor(state.localSkinId);
          const r=await RibbitCloud.createOnlineRoom({protocol:3,directCapable:gate.preflight?.ok===true,displayName:onlineName(),skinId:state.localSkinId,appearance:state.localAppearance,settings:ownSettings(),vocabulary:VOCABULARY});
          if(gen!==state.generation){if(r?.ok&&r.roomCode&&r.playerToken)sendLeaveRequest({protocol:3,roomCode:r.roomCode,playerToken:r.playerToken});return;}
          if(!r?.ok)throw new Error(r?.message||'Could not create a room.');
          connect(r);
        }catch(e){if(gen===state.generation){
          if(e.code==='DIRECT_UNAVAILABLE')failDirect(e.message);
          else if(e.code!=='DIRECT_CANCELLED')setStatus(e.message||String(e),true);
        }}
        finally{if(gen===state.generation)state.busy=false;}
      }
      async function joinRoom(){
        if(state.busy||!onlineAllowed())return;
        const code=state.codeText.trim().toUpperCase();if(!/^[A-Z2-9]{5}$/.test(code)){setStatus('ENTER A FIVE-CHARACTER ROOM CODE.',true);return;}
        state.busy=true;gate.lastAttempt={kind:'join',code};setStatus('CHECKING SERVER ACCESS...');const gen=++state.generation;
        try{
          await checkLocalDirectCapability();if(gen!==state.generation)return;
          setStatus('JOINING SERVER ROOM...');
          state.localAppearance=appearanceFor(state.localSkinId);
          const r=await RibbitCloud.joinOnlineRoom({protocol:3,directCapable:gate.preflight?.ok===true,displayName:onlineName(),roomCode:code,skinId:state.localSkinId,appearance:state.localAppearance});
          if(gen!==state.generation){if(r?.ok&&r.roomCode&&r.playerToken)sendLeaveRequest({protocol:3,roomCode:r.roomCode,playerToken:r.playerToken});return;}
          if(!r?.ok)throw new Error(r?.message||'Could not join this room.');
          connect(r);
        }catch(e){if(gen===state.generation){
          if(e.code==='DIRECT_UNAVAILABLE')failDirect(e.message);
          else if(e.code!=='DIRECT_CANCELLED')setStatus(e.message||String(e),true);
        }}
        finally{if(gen===state.generation)state.busy=false;}
      }
      function connect(r){
        if(r?.directOnlyVersion!==DIRECT.version||r?.directPolicy?.version!==DIRECT.version){
          if(r?.roomCode&&r?.playerToken)sendLeaveRequest({roomCode:r.roomCode,playerToken:r.playerToken});
          failDirect('DEPLOY THE FRIENDS EDITION SERVER BEFORE PUBLISHING THIS GAME.');return;
        }
        state.authorityRole='host';state.authorityVersion=1;state.cpuIndex=-1;state.exitMenu=false;state.takeoverNoticeUntil=0;state.takeoverReason='';state.lastRecoverySnapshot=null;game.onlineCpuIndex=-1;
        clearTimeout(state.pollTimer);clearTimeout(state.startTimer);
        resetNetworkSession(r.epoch);
        state.role=r.role;state.roomCode=r.roomCode;state.playerToken=r.playerToken;state.quickplay=!!r.quickplay;
        state.connected=true;state.active=false;state.screen='room';state.starting=false;
        if(!updateDirectPolicy(r.directPolicy))return;
        state.localReady=state.remoteReady=state.remoteConnected=false;
        state.localName=onlineName();state.localNameShort=state.localName.toUpperCase();
        state.remoteName='WAITING';state.remoteNameShort='WAITING';
        state.localAppearance=appearanceFor(state.localSkinId);state.remoteAppearance=null;
        state.remoteSkinId=localIndex()?'azure':'crimson';state.requestSequence=0;state.lobbyRevision=1;state.settingsRevision=1;
        state.readyForSettings=0;state.settingsEditing=false;state.lobbyEpoch=1;
        state.startSequenceSeen=0;state.nextRoundSequenceSeen=0;state.snapshotSequence=0;state.lastSnapshotSequence=0;
        state.lastSuccessfulExchangeAt=now();state.lastSnapshotAt=0;state.requestInFlight=false;state.pollDueAt=0;
        state.inputSequence=0;state.pendingInputEvents=[];state.unacknowledgedInputs=[];state.acknowledgedGuestInputSequence=0;
        state.pendingNextRoundCommand=null;state.pendingReturnLobbyCommandId='';state.pendingStartConfig=null;
        state.resultMatchId='';state.resultSeenMatchId='';state.resultRequest=null;state.resultRecorded=false;
        state.receivedSnapshotCount=0;state.rttMs=0;state.serverMs=0;state.heldControls.clear();state.remoteHeld=false;
        state.renderCorrections=[{x:0,y:0},{x:0,y:0}];state.connectionPaused=false;state.urgent=false;
        state.settings=ownSettings();state.lastSettingsFingerprint=JSON.stringify(state.settings);
        game.state='onlineSetup';game.pvpSetupFocusArea='skin';game.pvpSetupPlayerIndex=localIndex();
        syncPreview();RibbitCloud.setOnlineRealtimeActive?.(true);setStatus('SHARE THE ROOM CODE WITH YOUR FRIEND.');
        if(state.quickplay){
          state.settings=r.rules||{stage:'random',roundGoal:'endless',bestOf:3,timeLimit:60,timeOfDay:'random',unpause:false};
          applySettings(state.settings);state.screen='quickConnecting';game.state='onlineConnect';
          // Queue matching is not permission to start. Admit only after this
          // specific partner completes the direct path + two-way handshake.
          state.localReady=false;state.readyForSettings=0;state.lobbyRevision=2;
          quick.connectingAt=now();quick.rematch=quick.opponentRematch=false;
        }
        clearInterval(gate.timer);gate.timer=setInterval(tickDirectConnection,250);
        scheduleExchange(0);
      }
      function stopTimers(){clearTimeout(state.pollTimer);clearTimeout(state.startTimer);state.pollTimer=null;state.startTimer=null;state.pollDueAt=0;}
      function scheduleExchange(delay=0){
        if(!state.connected)return;
        // Playing frames never wait for these administrative/audit calls. Bound
        // their frequency even when jumps/catches ask for an urgent exchange.
        if(state.active&&syncClock.complete&&game.pvpMatchWinnerIndex===null&&
            !state.pendingNextRoundCommand&&!state.pendingReturnLobbyCommandId&&!gate.expectedDeparture){
          delay=Math.max(delay,DIRECT.controlMs-(now()-state.requestStartedAt));
        }
        if(state.requestInFlight){if(delay===0)state.urgent=true;return;}
        const due=now()+Math.max(0,delay);
        if(state.pollTimer&&state.pollDueAt<=due)return;
        clearTimeout(state.pollTimer);state.pollDueAt=due;
        state.pollTimer=setTimeout(()=>{state.pollTimer=null;state.pollDueAt=0;runExchange();},Math.max(0,due-now()));
      }
      function packet(){
        const p={protocol:3,lifecycleVersion:3,directProof:directProofPacket(),authorityVersion:state.authorityVersion,displayName:onlineName(),clientRttMs:state.rttMs,roundLoadKey:isAuthority()&&game.state==='countdown'?currentRoundKey():'',
          loadedRoundKey:syncClock.loaded?syncClock.key:'',armedSyncRevision:syncClock.revision,requestSequence:++state.requestSequence,roomCode:state.roomCode,playerToken:state.playerToken,
          quickplayAccepted:state.quickplay&&directReady(),quickplayRematchFor:state.quickplay&&quick.rematch&&directReady()?state.resultMatchId:'',
          lobbyRevision:state.lobbyRevision,ready:state.localReady&&directReady(),readyForSettings:directReady()?state.readyForSettings:0,
          skinId:state.localSkinId,appearance:state.localAppearance,settings:state.settings||ownSettings(),
          settingsRevision:state.settingsRevision,settingsEditing:state.settingsEditing,
          lastSnapshotSequence:state.lastSnapshotSequence,seenStartSequence:state.startSequenceSeen,
          ackInputSequence:state.acknowledgedGuestInputSequence,matchId:state.resultMatchId,held:state.heldControls.size>0};
        if(isAuthority()&&state.active&&['countdown','playing','pvpCelebration','pvpSuddenDeathAlert','won'].includes(game.state))p.snapshot=captureSnapshot();
        if(!isAuthority()&&state.pendingInputEvents.length)p.inputEvents=state.pendingInputEvents.slice(0,32);
        if(net.signal)p.peerSignal=net.signal;
        // The paired server enforces version, route confirmation, challenge exchange and freshness.
        p.directOnlyVersion=DIRECT.version;p.directVerified=directReady();
        p.ackClaimSequence=net.claimAck;
        if(!isAuthority()&&net.pendingClaims.length)p.catchClaims=net.pendingClaims.slice(0,24).map(({createdAt,confirmed,...c})=>c);
        if(isAuthority()&&state.active&&life.replayFrames.length&&now()-life.replayLastSend>=900){
          p.replayFrames=life.replayFrames.slice(0,80);life.replayLastSend=now();
        }
        if(state.pendingNextRoundCommand)p.nextRoundCommand=state.pendingNextRoundCommand;
        if(state.pendingReturnLobbyCommandId)p.returnLobbyCommandId=state.pendingReturnLobbyCommandId;
        return p;
      }
      async function runExchange(){
        if(!state.connected||state.requestInFlight)return;
        state.requestInFlight=true;state.urgent=false;state.requestStartedAt=now();
        const gen=state.generation,p=packet();let success=false;
        try{
          const r=await RibbitCloud.onlineExchange(p);
          if(gen!==state.generation||!state.connected)return;
          state.rttMs=now()-state.requestStartedAt;state.serverMs=Math.max(0,Number(r?.serverMs)||0);
          if(!r?.ok){const e=new Error(r?.message||'Relay request failed.');e.code=r?.code||'';throw e;}
          if(Number(r.protocol)!==3||r.directOnlyVersion!==DIRECT.version)throw Object.assign(new Error('Redeploy the new OnlineVersus.gs, then refresh BOTH laptops.'),{code:'UPDATE_REQUIRED'});
          state.lastSuccessfulExchangeAt=now();success=true;learnClock(r,state.rttMs);
          if(p.matchId===state.resultMatchId){life.replayAck=Math.max(life.replayAck,Number(r.replayAck)||0);life.replayFrames=life.replayFrames.filter(f=>f.q>life.replayAck);}
          net.auditClaimAck=Math.max(net.auditClaimAck||0,Number(r.acceptedClaimSequence)||0);
          net.pendingClaims=net.pendingClaims.filter(c=>c.sequence>Math.min(net.directClaimAck||0,net.auditClaimAck));
          if(p.nextRoundCommand?.commandId===state.pendingNextRoundCommand?.commandId)state.pendingNextRoundCommand=null;
          if(p.returnLobbyCommandId===state.pendingReturnLobbyCommandId)state.pendingReturnLobbyCommandId='';
          const accepted=Number(r.acceptedInputSequence)||0;
          state.pendingInputEvents=state.pendingInputEvents.filter(e=>e.sequence>accepted);
          applyResponse(r,p);
        }catch(e){
          if(gen!==state.generation)return;
          if(['DIRECT_PAIR_CLOSED','STALE_PAIR'].includes(e.code)){failDirect(e.message);return;}
          if(/^(ROOM_EXPIRED|ROOM_AUTH_FAILED|UPDATE_REQUIRED|SESSION_EXPIRED|REPLACED_BY_CPU|GUEST_SESSION_EXPIRED)$/.test(e.code||'')){
            disconnect(e.message||'Room connection ended.',e.code||'');return;
          }
          setStatus('CLOUD ROOM SERVICE RETRY: '+String(e.message||e).slice(0,62),true);
        }finally{
          if(gen===state.generation){
            state.requestInFlight=false;
            if(state.connected){
              const interval=success?(state.active&&syncClock.complete?DIRECT.controlMs:RELAY.lobbyPollMs):RELAY.retryPollMs;
              // Target a start-to-start cadence, not latency PLUS another full polling interval.
              const elapsed=now()-state.requestStartedAt;
              scheduleExchange(state.urgent?0:Math.max(success?25:RELAY.retryPollMs,interval-elapsed));
            }
          }
        }
      }
      function applyResponse(r,sent){
        if(r.directOnlyVersion!==DIRECT.version){failDirect('SERVER UPDATE REQUIRED');return;}
        if(Number.isInteger(r.cpuIndex)&&r.cpuIndex>=0&&state.cpuIndex<0){
          if(gate.everVerified&&state.active)adoptAuthority(r);
          else {failDirect('THE UNVERIFIED PAIRING ENDED. TRY ANOTHER OPPONENT.');return;}
        }else adoptAuthority(r);
        if(state.cpuIndex<0&&!updateDirectPolicy(r.directPolicy))return;
        const local=r.players?.[state.role],remote=r.players?.[state.role==='host'?'guest':'host'];
        state.remoteConnected=!!remote?.connected;state.remoteReady=!!remote?.ready;
        if(state.quickplay&&r.quickplayRematch)quick.opponentRematch=!!r.quickplayRematch[state.role==='host'?'guest':'host'];
        if(state.quickplay&&!state.active&&!remote){failDirect('YOUR MATCH PARTNER IS NO LONGER AVAILABLE.');return;}
        state.localName=String(local?.name||profile().name||state.localName||'PLAYER');
        state.localNameShort=state.localName.toUpperCase();
        state.remoteName=String(remote?.name||state.remoteName||'WAITING');
        state.remoteNameShort=state.cpuIndex>=0?'CPU LV 5':state.remoteConnected?state.remoteName.toUpperCase():'WAITING';
        state.remoteSkinId=remote?.skinId||(localIndex()?'azure':'crimson');state.remoteAppearance=remote?.appearance||null;
        if(local&&Number(local.lobbyRevision)>=state.lobbyRevision)state.localReady=!!local.ready&&directReady();
        const revision=Number(r.settingsRevision)||1;
        if(state.role==='guest'&&revision!==state.settingsRevision){
          state.settingsRevision=revision;state.localReady=false;state.readyForSettings=0;state.lobbyRevision++;
        }
        if(state.role==='guest'&&r.settings){state.settings={...r.settings};if(!state.active)applySettings(r.settings);}
        if(state.role==='host'&&!state.active&&r.settingsRevision)state.settingsRevision=Math.max(state.settingsRevision,revision);
        const lobbyEpoch=Number(r.lobbyEpoch)||1;
        if(lobbyEpoch!==state.lobbyEpoch){
          state.lobbyEpoch=lobbyEpoch;returnToLobbyLocal();state.localReady=false;state.readyForSettings=0;state.lobbyRevision++;
        }
        if(!state.active){syncPreview();
          if(state.error&&r.roomStatus==='lobby')setStatus('');
        }
        // Exchange connection details BEFORE handling the server's start command.
        if(r.peerSignal)receivePeerSignal(r.peerSignal);
        tickDirectConnection();
        if(!state.connected)return;
        if(Number(r.startSequence)>state.startSequenceSeen&&r.startConfig){
          state.startSequenceSeen=Number(r.startSequence);state.starting=true;state.localReady=state.remoteReady=true;
          clearTimeout(state.startTimer);state.pendingStartConfig=r.startConfig;
          beginMatch(r.startConfig);
        }
        // Deliberately DO NOT consume newInputEvents/newCatchClaims/latestSnapshot
        // from the control API. They are audit/recovery data, never live transport fallback.
        if(state.pendingStartConfig&&!state.active&&directReady())beginMatch(state.pendingStartConfig);
        readStartSync(r.startSync);
        if(state.active&&isAuthority()&&!state.remoteConnected)state.remoteHeld=false;
        if(r.result&&r.result.matchId!==state.resultSeenMatchId){state.resultSeenMatchId=r.result.matchId;handleResult(r.result);}
      }
      function applyRemoteInput(e){
        const p=pvpPlayers[1];state.remoteHeld=e.action==='down';
        if(e.action==='down')pressPvpButton(1,'online');
        else {
          // Down and up can arrive in one batch. Preserve the actual sampled
          // guest charge instead of turning every batched release into a tiny tap.
          if(e.wasCharging&&p.grounded&&!p.bonked&&p.stunTimer<=0){
            if(!p.inputHeld)pressPvpButton(1,'online');
            if(p.charging){p.charge=clamp(Number(e.charge)||0.04,0.04,1);p.chargeDirection=e.chargeDirection<0?-1:1;
              p.chargeHoldTime=clamp(Number(e.holdSeconds)||0,0,60);}
          }
          const launched=p.charging&&p.grounded;
          releasePvpButton(1,'online');
          if(launched&&!p.grounded)compensateRemoteLaunch(e);
        }
      }
      function beginMatch(config){
        if(!config||!state.connected)return;
        if(config.directOnlyVersion!==DIRECT.version||config.directPairId!==gate.pairId){failDirect('THE MATCH BELONGS TO AN OLD CONNECTION. CREATE A NEW ROOM.');return;}
        if(!directReady()){
          state.pendingStartConfig=config;state.starting=false;state.localReady=false;
          setStatus('WAITING FOR VERIFIED SERVER CONNECTION');return;
        }
        state.authorityRole='host';state.authorityVersion=1;state.cpuIndex=-1;game.onlineCpuIndex=-1;state.exitMenu=false;
        if(state.active&&state.resultMatchId===config.matchId)return;
        state.active=true;state.starting=false;state.screen='match';state.resultMatchId=config.matchId;
        state.resultRecorded=false;state.resultSeenMatchId='';state.pendingStartConfig=null;
        life.replayFrames=[];life.replaySeq=0;life.replayBase=now();life.replayLast=0;life.replayLastSend=0;life.replayAck=0;
        state.quickplay=!!config.quickplay;quick.roundStages=Array.isArray(config.roundStages)?config.roundStages.slice(0,3):[];
        quick.victoryKey='';quick.rematch=quick.opponentRematch=false;quick.pendingAction='';quick.message='';game.quickplayNextRoundAt=0;
        if(config.hostName||config.guestName){
          const localName=state.role==='host'?config.hostName:config.guestName,otherName=state.role==='host'?config.guestName:config.hostName;
          state.localNameShort=String(localName||onlineName()).toUpperCase();state.remoteNameShort=String(otherName||'FRIEND').toUpperCase();
        }
        resetRoundNetwork('');net.pendingClaims=[];net.remoteBuffer.clear();net.localFlightAge=0;
        state.inputSequence=Number(config.inputSequenceBase)||0;state.acknowledgedGuestInputSequence=Number(config.inputSequenceBase)||0;
        net.claimSequence=Number(config.claimSequenceBase)||0;net.claimAck=Number(config.claimSequenceBase)||0;
        net.directClaimAck=net.auditClaimAck=net.claimSequence;
        state.lastSnapshotSequence=0;state.snapshotSequence=0;state.lastSnapshotAt=now();state.receivedSnapshotCount=0;
        state.renderCorrections=[{x:0,y:0},{x:0,y:0}];state.pendingInputEvents=[];state.unacknowledgedInputs=[];state.heldControls.clear();state.remoteHeld=false;
        state.connectionPaused=false;state.awaitingHostFrame=state.role==='guest';
        state.localReady=state.remoteReady=false;game.onlineMode=true;game.onlineRole=state.role;game.pvpCpuEnabled=false;
        game.pvpSetupLevelId=config.stage;game.pvpRoundGoalMode=config.goalMode;game.pvpFirstTo=config.firstTo;game.pvpBestOf=config.bestOf;
        game.pvpTimeLimitSeconds=config.timeLimit;game.timeOfDayLock=config.timeOfDay;game.moonPhaseIndex=config.moonPhaseIndex;
        game.pvpSetupSkinIds=[config.hostSkin,config.guestSkin];
        game.pvpSetupSkinIndex=game.pvpSetupSkinIds.map(id=>Math.max(0,PVP_FROG_SKIN_ORDER.indexOf(id)));
        window.RibbitOnlineAppearanceOverrides=[config.hostAppearance,config.guestAppearance];
        if(!state.previousVocabulary)state.previousVocabulary=VOCABULARY;
        if(Array.isArray(config.vocabulary)&&config.vocabulary.length>=4)VOCABULARY=normalizeVocabularyEntries(config.vocabulary);
        // Never run the local selector's availability normalization on the guest's
        // remotely owned custom palette before starting the match.
        game.state='onlineSetup';startNewPvpCountdown(true);lastFrameTime=performance.now();accumulator=0;startBackgroundClock();canvas.focus({preventScroll:true});scheduleExchange(0);
      }
      function encodePlayer(p){
        const out={};
        for(const [k,v] of Object.entries(p)){
          if(typeof v==='number')out[k]=Number.isFinite(v)?v:(v<0?-1e9:1e9);
          else if(typeof v==='string'||typeof v==='boolean'||v===null)out[k]=v;
        }
        out.tongue={...p.tongue};
        out.oneJumpStartingFlyIds=p.oneJumpStartingFlyIds instanceof Set?[...p.oneJumpStartingFlyIds]:[];
        out.departurePlatformIndex=platforms.indexOf(p.departurePlatform);
        out.dropThroughPlatformIndex=platforms.indexOf(p.dropThroughPlatform);
        return out;
      }
      function captureSnapshot(){
        preparePromptPlan();const g={};for(const k of GAME_FIELDS)g[k]=game[k];
        const base=Math.max(1,Number(game.promptSerial)||1);
        return {protocol:3,authorityVersion:state.authorityVersion,authorityRole:state.authorityRole,cpuIndex:state.cpuIndex,matchId:state.resultMatchId,roundKey:currentRoundKey(),sequence:++state.snapshotSequence,
          sentAt:Date.now(),sampleServerAt:serverNow(),sampleClock:net.simClock,hostRtt:state.rttMs,startSync:{key:syncClock.key,revision:syncClock.revision,phase:syncClock.phase,countdownAt:syncClock.countdownAt,goAt:syncClock.goAt},
          inputAck:state.acknowledgedGuestInputSequence,claimAck:net.claimAck,levelId:game.selectedLevelId,game:g,
          players:pvpPlayers.map(encodePlayer),flies:flies.map(f=>JSON.parse(JSON.stringify(f))),
          platforms:platforms.map(p=>({x:p.x,y:p.y})),impacts:(game.pvpImpactEffects||[]).slice(-8).map(e=>JSON.parse(JSON.stringify(e))),
          promptBase:base,promptTargets:net.promptPlan.slice(base,base+17),
          motionHistory:net.history,launches:net.launches,confirmedCatches:net.catches,claimReceipts:net.receipts,
          simulation:{spawnQueue:game.spawnQueue,completedVocabIndices:[...game.completedVocabIndices],nextFlyId,lastFlySpawnIndex:game.lastFlySpawnIndex,
            lastFlySpawnTime:Number.isFinite(game.lastFlySpawnTime)?game.lastFlySpawnTime:-1e9,
            pvpBonkCounts:game.pvpBonkCounts,pvpRoundBonkCounts:game.pvpRoundBonkCounts,pvpMatchBonkCounts:game.pvpMatchBonkCounts,pvpSelfBonkCounts:game.pvpSelfBonkCounts}};
      }
      function unpackPlayer(player,data){
        for(const [k,v] of Object.entries(data||{})){
          if(k==='tongue')player.tongue={...v};
          else if(k==='oneJumpStartingFlyIds')player.oneJumpStartingFlyIds=new Set(Array.isArray(v)?v:[]);
          else if(!['departurePlatformIndex','dropThroughPlatformIndex'].includes(k))player[k]=v;
        }
        player.departurePlatform=platforms[data.departurePlatformIndex]||null;
        player.dropThroughPlatform=platforms[data.dropThroughPlatformIndex]||null;
      }
      function predictPlayerFor(player,seconds){
        let rest=Math.min(RELAY.maxPredictionMs/1000,Math.max(0,seconds));
        while(rest>0.00001){const dt=Math.min(STEP,rest);updatePvpPlayer(player,dt);rest-=dt;}
      }
      function applySnapshot(s,r={}){
        if(!r.direct||!directReady())return;
        if(isAuthority()||Number(s?.authorityVersion||1)!==state.authorityVersion)return;
        if(!s||s.protocol!==3||s.matchId!==state.resultMatchId||s.sequence<=state.lastSnapshotSequence||!Array.isArray(s.players)||s.players.length!==2)return;
        state.lastRecoverySnapshot=s;
        const first=state.receivedSnapshotCount===0, previousState=game.state,previousRound=game.pvpRoundNumber;
        const key=s.roundKey||state.resultMatchId+':'+s.game.pvpRoundNumber+':'+(s.game.pvpSuddenDeath?'sd':'normal');
        const roundChanged=key!==net.roundKey;if(roundChanged)resetRoundNetwork(key);
        state.lastSnapshotSequence=s.sequence;state.lastSnapshotAt=now();state.receivedSnapshotCount++;state.awaitingHostFrame=false;
        // Only the actual live host frame acknowledges gameplay. The control API
        // pendingInputEvents queue is a separate audit stream for existing records.
        state.unacknowledgedInputs=state.unacknowledgedInputs.filter(e=>e.sequence>Number(s.inputAck||0));
        net.directClaimAck=Math.max(net.directClaimAck||0,Number(s.claimAck)||0);
        net.pendingClaims=net.pendingClaims.filter(c=>c.sequence>Math.min(net.directClaimAck,net.auditClaimAck||0));
        const pending=state.unacknowledgedInputs.length>0;
        if(s.levelId!==game.selectedLevelId&&LEVELS[s.levelId]){game.selectedLevelId=s.levelId;applySelectedLevel();}
        const old=pvpPlayers.map(p=>({x:p.x,y:p.y,charging:p.charging,charge:p.charge,chargeDirection:p.chargeDirection,chargeHoldTime:p.chargeHoldTime,
          collision:p.onlineCollisionVersion||0,tongue:{...p.tongue},sparkle:p.catchSparkleTimer,
          motion:Object.fromEntries(MOTION_FIELDS.map(k=>[k,p[k]]))}));
        const previousCritical=game.pvpCriticalCatchActive,previousCriticalElapsed=game.pvpCriticalCatchElapsed;
        const oldWorld=game.worldTime,oldCritical={active:previousCritical,elapsed:previousCriticalElapsed,key:game.pvpCriticalCatchEventId,played:game.pvpCriticalCatchPlayedThisRound};
        for(const k of GAME_FIELDS)if(Object.prototype.hasOwnProperty.call(s.game||{},k))game[k]=s.game[k];
        game.onlineMode=true;game.onlineRole='guest';game.pvpCpuEnabled=false;
        const hard=first||roundChanged||previousRound!==game.pvpRoundNumber||(['countdown','pvpCelebration','won','pvpSuddenDeathAlert'].includes(game.state)&&previousState!==game.state);
        if(Array.isArray(s.platforms))s.platforms.forEach((p,i)=>{if(platforms[i]&&!platforms[i].moving){platforms[i].x=p.x;platforms[i].y=p.y;}});
        if(Array.isArray(s.promptTargets))s.promptTargets.forEach((v,i)=>{if(Number.isInteger(v))net.promptPlan[Number(s.promptBase)+i]=v;});
        consumeCatchReceipts(s);
        if(r.direct){net.remoteSamples=[];net.remoteLaunches=[];net.remotePlay=null;net.remoteDisplay=null;}
        else mergeRemoteHistory(s);
        const fallback=(Math.max(0,Number(r.snapshotAgeMs)||0)+state.rttMs*.5+Math.max(0,Number(s.hostRtt)||0)*.5)/1000;
        const measured=net.clockKnown&&Number.isFinite(s.sampleServerAt)?(serverNow()-s.sampleServerAt)/1000:fallback;
        const age=clamp(r.direct?net.peerRtt/2000:measured,0,RELAY.maxPredictionMs/1000);
        syncClock.worldRate=game.state==='playing'?(game.pvpCriticalCatchActive?.18:1):0;
        syncClock.worldTarget=(Number(s.game.worldTime)||0)+age*syncClock.worldRate;syncClock.worldSampleAt=now();
        game.worldTime=hard?syncClock.worldTarget:oldWorld;setPlatformsToClock();
        game.onlinePredicting=true;
        try {
          s.players.forEach((data,i)=>{
            const p=pvpPlayers[i];unpackPlayer(p,data);
            const collisionChanged=(Number(data.onlineCollisionVersion)||0)!==old[i].collision;
            const ownContinuity=i===1&&!hard&&!data.bonked&&Number(data.stunTimer)<=0&&!collisionChanged&&
              (pending||net.localFlightSequence>0||state.heldControls.size>0);
            if(ownContinuity){
              for(const k of MOTION_FIELDS)p[k]=old[i].motion[k];
              if(old[i].tongue.active)p.tongue=old[i].tongue;
              p.catchSparkleTimer=Math.max(p.catchSparkleTimer||0,old[i].sparkle||0);
            }else {alignSnapshotRider(p,data,s);if(game.state==='playing'&&!game.pvpCriticalCatchActive)predictPlayerFor(p,i===0?Math.min(.08,age):age);}
            reconcileTongue(p,old[i].tongue,hard);
            if(i===1&&state.heldControls.size&&p.grounded&&!p.bonked&&p.stunTimer<=0&&game.state==='playing'){
              p.inputHeld=true;if(!p.charging)startPvpCharge(p);
              if(old[i].charging&&!hard){p.charge=old[i].charge;p.chargeDirection=old[i].chargeDirection;p.chargeHoldTime=old[i].chargeHoldTime;}
            }
            if(i===1&&!state.heldControls.size)p.inputHeld=false;
            const correctionCap=collisionChanged?18:28;
            state.renderCorrections[i]=hard||ownContinuity||i===0?{x:0,y:0}:{x:clamp(old[i].x-p.x,-correctionCap,correctionCap),y:p.grounded?0:clamp(old[i].y-p.y,-correctionCap,correctionCap)};
          });
        }finally{game.onlinePredicting=false;}
        if(Array.isArray(s.flies)){flies.length=0;s.flies.forEach(f=>flies.push({...f}));}
        game.spawnQueue=[];game.pvpImpactEffects=(s.impacts||[]).map(e=>({...e,elapsed:Math.max(0,Number(e.elapsed)||0)+Math.min(.2,age)}));
        net.lastAuth={score:pvpPlayers[1].score,promptSerial:game.promptSerial,targetVocabIndex:game.targetVocabIndex};
        overlayPredictedCatches();mergeWrongFlyVisuals();
        if(previousCritical&&net.predictionHold&&!game.pvpCriticalCatchActive){game.pvpCriticalCatchActive=true;game.pvpCriticalCatchWinnerIndex=1;game.pvpCriticalCatchElapsed=previousCriticalElapsed;}
        if(game.pvpCriticalCatchActive&&previousCritical&&!hard)game.pvpCriticalCatchElapsed=Math.max(previousCriticalElapsed,game.pvpCriticalCatchElapsed);
        if(net.finalSpeculated&&!hard&&(net.predictionHold||game.pvpCriticalCatchWinnerIndex===1)){
          game.pvpCriticalCatchElapsed=Math.max(game.pvpCriticalCatchElapsed||0,net.finalVisualElapsed);
          if(game.pvpCriticalCatchElapsed>=game.pvpCriticalCatchDuration)game.pvpCriticalCatchActive=false;
        }
        reconcileCritical(s,oldCritical);
        if(game.state==='countdown'){syncClock.loaded=true;readStartSync(s.startSync);}
        if(syncClock.complete&&s.game.state==='countdown'&&key===syncClock.key)game.state='playing';
        state.lastScores=pvpPlayers.map(p=>p.score);
      }
      function updateGuest(dt){
        if(!state.active)return;
        state.connectionPaused=now()-state.lastSnapshotAt>RELAY.staleMs; // status only, never a pause
        const decay=Math.exp(-14*dt);state.renderCorrections.forEach(c=>{c.x*=decay;c.y*=decay;});
        if(game.state==='countdown'){if(!synchronizedCountdown(dt)&&!state.awaitingHostFrame)updateResumeCountdown(dt);return;}
        if(game.state==='pvpCelebration'){game.pvpCelebrationTimer=Math.max(0,game.pvpCelebrationTimer-dt);if(game.pvpCelebrationTimer===0)game.state='won';return;}
        if(game.state==='won'){game.winInputLock=Math.max(0,game.winInputLock-dt);return;}
        if(game.state==='pvpSuddenDeathAlert'){game.pvpSuddenDeathAlertTimer=Math.max(0,game.pvpSuddenDeathAlertTimer-dt);return;}
        if(game.state!=='playing')return;
        game.onlinePredicting=true;
        try {
          let scale=1;
          if(game.pvpCriticalCatchActive){game.pvpCriticalCatchElapsed=Math.min(game.pvpCriticalCatchDuration,game.pvpCriticalCatchElapsed+dt);
            const u=game.pvpCriticalCatchElapsed/Math.max(.001,game.pvpCriticalCatchDuration);scale=u>=1?1:u<.18?.055:u<.72?.18:.34;
            if(net.finalSpeculated&&(game.pvpCriticalCatchWinnerIndex===1||net.predictionHold))net.finalVisualElapsed=Math.max(net.finalVisualElapsed,game.pvpCriticalCatchElapsed);
            if(u>=1)game.pvpCriticalCatchActive=false;}
          const sim=dt*scale;net.localFlightAge=(net.localFlightAge||0)+sim;advanceSmoothWorld(sim);
          if(!game.pvpCriticalCatchActive&&game.pvpWinPendingIndex===null){game.pvpElapsed+=sim;game.elapsed+=sim;
            if(game.pvpTimeLimitSeconds>0&&!game.pvpSuddenDeath)game.pvpTimeRemaining=Math.max(0,game.pvpTimeLimitSeconds-game.pvpElapsed);}
          updatePvpMovingPlatforms();
          for(const p of pvpPlayers){updatePvpPlayer(p,sim);updateFrogAfterimages(p,sim,getPvpSkinPalette(p.skinId,p.index?'crimson':'azure',p.index),true);}
          animateFlies(sim);updatePredictedFlies(sim);updatePvpImpactEffects(sim);updateRemotePlayback(dt);
        }finally{game.onlinePredicting=false;}
      }
      function advanceLocalCharge(p,dt){
        p.chargeHoldTime+=dt;p.charge+=p.chargeDirection*dt/CONFIG.chargeSecondsOneWay;
        if(p.charge>=1){p.charge=1;p.chargeDirection=-1;}else if(p.charge<=.04){p.charge=.04;p.chargeDirection=1;}
      }
      function isJumpControl(e){return ['Space','KeyW','ArrowUp','KeyZ','ShiftLeft','ShiftRight','PointerJump'].includes(String(e?.code||''));}
      function isInputHeld(index){
              if(!state.active)return null;
              if(index===state.cpuIndex)return !!pvpPlayers[index]?.inputHeld;
              if(index===localIndex())return state.heldControls.size>0;
              return isAuthority()?state.remoteHeld:!!pvpPlayers[index]?.inputHeld;
            }
      function queueGuestInput(action,sample){
        const e={sequence:++state.inputSequence,action,sentAt:Date.now(),serverAt:serverNow(),roundKey:currentRoundKey(),matchId:state.resultMatchId,
          charge:sample.charge,chargeDirection:sample.chargeDirection,holdSeconds:sample.chargeHoldTime,wasCharging:!!sample.charging};
        state.pendingInputEvents.push(e);state.unacknowledgedInputs.push(e);net.localActionAt=now();
        if(action==='up'&&sample.charging&&sample.grounded){net.localFlightSequence=e.sequence;net.localFlightStarted=now();net.localFlightAge=0;}
        sendPeer('inputs',[e]);if(!directReady())scheduleExchange(0);
      }
      function handleControlDown(e){
        if(!state.active||game.mode!=='pvp'||!isJumpControl(e))return false;
        e.preventDefault?.();e.stopPropagation?.();
        if(e.repeat||state.exitMenu||game.state!=='playing'||!checkDirectHealth())return true;
        if(state.unacknowledgedInputs.length>=64){setStatus('WAITING FOR SERVER INPUT ACKNOWLEDGEMENT.',true);return true;}
        const wasHeld=state.heldControls.size>0;state.heldControls.add(String(e.code));if(wasHeld)return true;
        const p=pvpPlayers[localIndex()];
        if(isAuthority()){pressPvpButton(localIndex(),'online');scheduleExchange(0);}
        else{queueGuestInput('down',p);game.onlinePredicting=true;try{pressPvpButton(1,'prediction');}finally{game.onlinePredicting=false;}}
        return true;
      }
      function handleControlUp(e){
        if(!state.active||game.mode!=='pvp'||!isJumpControl(e))return false;
        e.preventDefault?.();e.stopPropagation?.();const had=state.heldControls.delete(String(e.code));
        if(!had||state.heldControls.size)return true;
        const p=pvpPlayers[localIndex()];
        if(isAuthority()){releasePvpButton(localIndex(),'online');scheduleExchange(0);}
        else{const sample={...p};queueGuestInput('up',sample);game.onlinePredicting=true;
          try{releasePvpButton(1,'prediction');}finally{game.onlinePredicting=false;}}
        return true;
      }
      function releaseHeldControl(){
        if(!state.heldControls.size)return;
        const sample={...pvpPlayers[localIndex()]};state.heldControls.clear();
        if(isAuthority())releasePvpButton(localIndex(),'online');
        else if(state.active){queueGuestInput('up',sample);game.onlinePredicting=true;
          try{releasePvpButton(1,'prediction');}finally{game.onlinePredicting=false;}}
      }
      function setReady(){
        if(!state.connected||state.active||state.starting||state.settingsEditing)return;
        if(!state.remoteConnected){setStatus('WAITING FOR A FRIEND TO JOIN.',true);return;}
        if(!directReady()){setStatus(directStatus(),false);tickDirectConnection();return;}
        if(state.localSkinId===state.remoteSkinId){setStatus('CHOOSE DIFFERENT FROGS BEFORE READYING.',true);return;}
        state.localReady=!state.localReady;state.readyForSettings=state.settingsRevision;state.lobbyRevision++;
        setStatus('');tone(state.localReady?660:360,.055,.012,25);scheduleExchange(0);
      }
      function cycleSkin(delta){
        if(!state.connected||state.active||state.starting)return;
        const ids=PVP_FROG_SKIN_ORDER.filter(isPvpSkinAvailable);if(!ids.length)return;
        const index=Math.max(0,ids.indexOf(state.localSkinId));state.localSkinId=ids[(index+delta+ids.length)%ids.length];
        state.localAppearance=appearanceFor(state.localSkinId);state.localReady=false;state.lobbyRevision++;
        syncPreview();setStatus('');tone(480,.035,.01,30);scheduleExchange(0);
      }
      function settingsChanged(){
        if(!state.connected||state.role!=='host'||state.active)return;
        const settings=ownSettings(),fingerprint=JSON.stringify(settings);
        if(fingerprint===state.lastSettingsFingerprint)return;
        state.settings=settings;state.lastSettingsFingerprint=fingerprint;state.settingsRevision++;
        state.localReady=false;state.readyForSettings=0;state.lobbyRevision++;scheduleExchange(0);
      }
      function openSettings(){
        if(state.role!=='host'||state.active||state.starting)return;
        state.localReady=false;state.settingsEditing=true;state.lobbyRevision++;state.screen='settings';
        game.state='pvpSettings';game.pvpSettingsFocusIndex=0;scheduleExchange(0);
      }
      function closeSettings(){
        settingsChanged();state.settingsEditing=false;state.lobbyRevision++;state.screen='room';
        game.state='onlineSetup';game.pvpSetupFocusArea='bottom';game.pvpSetupBottomSelection='settings';scheduleExchange(0);
      }
      async function handleHostRoundCompletion(roundWinner,matchWinner){
        if(!isHostActive()||matchWinner===null||state.resultRecorded)return;
        state.resultRecorded=true;
        // Saving after the simulation callback finishes lets the final game state
        // reach celebration, while the animation and exchange loop keep running.
        clearTimeout(state.resultRetryTimer);
        state.resultRetryTimer=setTimeout(()=>saveResult(matchWinner,0),150);
      }
      async function saveResult(matchWinner,attempt){
        if(!state.connected||!state.resultMatchId)return;
        const gen=state.generation;
        try{
          const r=await RibbitCloud.finishOnlineMatch({protocol:3,roomCode:state.roomCode,playerToken:state.playerToken,
            matchId:state.resultMatchId,winnerRole:matchWinner===0?'host':'guest',finalSnapshot:captureSnapshot()});
          if(gen!==state.generation)return;
          if(!r?.ok)throw Object.assign(new Error(r?.message||'Result did not save.'),{code:r?.code});
          handleResult(r.result);sendPeer('result',r.result);scheduleExchange(0);
        }catch(e){if(gen!==state.generation)return;
          if(attempt<6&&!/^(DIRECT_PAIR_CLOSED|ROOM_AUTH_FAILED|SESSION_EXPIRED)$/.test(e.code||'')){scheduleExchange(0);state.resultRetryTimer=setTimeout(()=>saveResult(matchWinner,attempt+1),1000*(attempt+1));}
          else setStatus('MATCH FINISHED. WIN NOT SAVED: '+String(e.message||e),true);
        }
      }
      function handleResult(result){
        if(!result||result.matchId!==state.resultMatchId)return;
        if(result.winnerRole===state.role&&!result.winnerCpu&&typeof result.pvpMatchWins==='number'&&Number.isFinite(result.pvpMatchWins)){
          // Apply the server's absolute total. Do not add a second local win.
          statsProfile.pvpMatchWins=Math.max(statsProfile.pvpMatchWins||0,Number(result.pvpMatchWins));
          saveStatsProfile();savePvpMatchWinsForLeaderboard();
          setTimeout(() => { try { RibbitCloud.flushSave(true); } catch (_) {} }, 80);
        }
        state.resultSeenMatchId=result.matchId;
        setStatus(result.winnerRole===state.role&&!result.winnerCpu?(result.winnerGuest?"":'MATCH WIN SAVED'):'MATCH COMPLETE');
      }
      function notifyNextRound(resetMatch){
        if(!isHostActive())return;
        if(resetMatch){returnToLobby();return;}
        state.pendingNextRoundCommand={commandId:commandId('round'),resetMatch:false};scheduleExchange(0);
      }
      function returnToLobbyLocal(){
        releaseHeldControl();stopBackgroundClock();state.active=false;state.starting=false;state.screen='room';state.resultRecorded=false;
        state.pendingInputEvents=[];state.unacknowledgedInputs=[];state.lastSnapshotSequence=0;state.snapshotSequence=0;
        state.localReady=state.remoteReady=false;state.readyForSettings=0;state.lobbyRevision++;
        clearTimeout(state.startTimer);state.startTimer=null;state.pendingStartConfig=null;
        state.renderCorrections=[{x:0,y:0},{x:0,y:0}];state.settingsEditing=false;
        game.state='onlineSetup';game.pvpCriticalCatchActive=false;
        applySettings(state.settings);syncPreview();canvas.focus({preventScroll:true});
      }
      function returnToLobby(){
        if(state.quickplay){quickVictoryAction('replay');return;}
        if(!state.connected){open();return;}
        state.pendingReturnLobbyCommandId=commandId('lobby');returnToLobbyLocal();scheduleExchange(0);
      }
      function cleanup(restoreActivity=true){
        cancelDirectPreflight();clearInterval(gate.timer);gate.timer=null;
        gate.pairAt=0;gate.phase='idle';gate.everVerified=false;gate.expectedDeparture=false;gate.finishedOffline=false;
        gate.pairId='';gate.localChallenge='';gate.serverVerified=false;gate.lossAt=0;gate.offerAttempt=0;gate.retries=0;
        releaseHeldControl();
        state.exitMenu=false;state.cpuIndex=-1;state.authorityRole='host';state.authorityVersion=1;state.takeoverNoticeUntil=0;state.takeoverReason='';state.lastRecoverySnapshot=null;game.onlineCpuIndex=-1;
        quick.queued=false;quick.background=false;clearTimeout(quick.queueTimer);
        quick.generation++;quick.token='';quick.pendingAction='';quick.victoryKey='';quick.rematch=quick.opponentRematch=false;state.quickplay=false;game.quickplayNextRoundAt=0;
        stopTimers();stopBackgroundClock();closePeer();clearTimeout(state.resultRetryTimer);state.generation++;
        state.active=false;state.connected=false;state.role=null;state.roomCode='';state.playerToken='';state.screen='closed';
        state.requestInFlight=false;state.starting=false;state.busy=false;state.localReady=state.remoteReady=false;
        state.pendingNextRoundCommand=null;state.pendingReturnLobbyCommandId='';state.pendingStartConfig=null;
        state.heldControls.clear();state.remoteHeld=false;state.remoteConnected=false;state.connectionPaused=false;
        state.pendingInputEvents=[];state.unacknowledgedInputs=[];game.onlineMode=false;game.onlineRole=null;game.onlinePredicting=false;
        window.RibbitOnlineAppearanceOverrides=null;
        if(state.previousSetup){applySettings(state.previousSetup.settings);game.pvpCpuEnabled=state.previousSetup.cpu;
          game.pvpSetupSkinIds=state.previousSetup.skins;game.pvpSetupSkinIndex=game.pvpSetupSkinIds.map(id=>Math.max(0,PVP_FROG_SKIN_ORDER.indexOf(id)));}
        if(state.previousVocabulary){VOCABULARY=state.previousVocabulary;state.previousVocabulary=null;}
        state.previousSetup=null;game.state='pvpSetup';game.mode='pvp';
        RibbitCloud.setOnlineRealtimeActive?.(false);canvas.focus({preventScroll:true});
        if(restoreActivity&&quick.suspendedActivity){const saved=quick.suspendedActivity;quick.suspendedActivity=null;restoreLocalActivity(saved);}
      }
      function leaveRoom(){
        const req={protocol:3,lifecycleVersion:3,roomCode:state.roomCode,playerToken:state.playerToken},connected=state.connected;
        if(connected){sendPeer('leaving',{role:state.role});sendLeaveRequest(req);}
        cleanup();
      }
      function disconnect(message,code=''){
        const wasQuickplay=state.quickplay;
        const lastSkin=state.localSkinId;
        if(code==='REPLACED_BY_CPU'&&wasQuickplay){
          // The server has released this participant's old Quickplay reservation.
          // Return directly to frog select so a reconnecting player can queue again.
          quick.suspendedActivity=null;quick.peekActivity=null;cleanup(false);open();
          state.localSkinId=normalizePvpSkinId(lastSkin,'azure');state.localAppearance=appearanceFor(state.localSkinId);
          openQuickplay();quick.message='PLAYER DISCONNECTED - READY TO FIND A NEW MATCH';quick.error='';return;
        }
        if(wasQuickplay&&state.active&&game.pvpMatchWinnerIndex!==null){
          stopTimers();stopBackgroundClock();closePeer();state.connected=false;state.remoteConnected=false;
          quick.message='OPPONENT LEFT - SELECT REQUEUE';return;
        }
        cleanup();open();setStatus(message,true);
      }
      function statusText(){
        if(state.message&&state.error)return state.message;
        if(state.connected&&state.cpuIndex<0&&!directReady())return directStatus();
        if(state.starting)return 'SERVER CONNECTED - STARTING MATCH';
        if(!state.remoteConnected)return 'WAITING FOR YOUR FRIEND';
        if(state.localSkinId===state.remoteSkinId)return 'CHOOSE DIFFERENT FROGS';
        if(state.settingsEditing)return 'ONLY YOU CAN SEE THIS SETTINGS SCREEN';
        if(state.localReady&&state.remoteReady)return 'BOTH READY - SYNCING START';
        if(state.localReady)return 'YOU ARE READY - WAITING FOR YOUR FRIEND';
        return 'SERVER CONNECTED - BOTH PLAYERS PRESS READY';
      }
      function fitText(text,x,y,maxW,scale=.72,color='#59666b',align='center'){
        let s=scale;const width=measureBitmapText(String(text),s);if(width>maxW)s*=maxW/width;
        drawBitmapText(text,x,y,s,align,color);
      }
      function drawPanel(title){
        const level=getPvpSetupPreviewLevelId(),panel={x:28,y:8,w:424,h:254};
        drawBackground(level);ctx.fillStyle='rgba(18,33,41,.23)';ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(12,26,33,.34)';ctx.fillRect(35,16,424,254);ctx.fillStyle=COLORS.ink;
        ctx.fillRect(32,8,416,254);ctx.fillRect(28,12,424,246);ctx.fillStyle='#f7fdff';
        ctx.fillRect(35,12,410,246);ctx.fillRect(32,16,416,238);
        const a=getPvpSkinPalette(state.localSkinId,'azure'),b=FROG_SKINS.crimson;
        ctx.fillStyle=a.dark;ctx.fillRect(40,17,200,40);ctx.fillStyle=b.dark;ctx.fillRect(240,17,200,40);
        ctx.fillStyle=a.mid;ctx.fillRect(42,19,198,35);ctx.fillStyle=b.mid;ctx.fillRect(240,19,198,35);
        ctx.fillStyle=a.light;ctx.fillRect(45,21,195,4);ctx.fillStyle=b.light;ctx.fillRect(240,21,195,4);
        drawBitmapText(title,W/2,27,1.7,'center',COLORS.white,COLORS.ink);return panel;
      }
      function drawEntry(){drawOnlineEntry();}
      function drawReadyBars(){
        for(let i=0;i<2;i++){
          const own=i===localIndex(),rect=i===0?PVP_SETUP_UI.p1Selector:PVP_SETUP_UI.p2Selector;
          const ready=own?state.localReady:state.remoteReady,connected=own||state.remoteConnected;
          const palette=getPvpSetupPreviewPalette(i),y=rect.y+rect.h+2;
          ctx.fillStyle='rgba(25,43,52,.2)';ctx.fillRect(rect.x+2,y+2,rect.w,15);
          ctx.fillStyle=ready?palette.dark:'#9aa9ae';ctx.fillRect(rect.x,y,rect.w,15);
          ctx.fillStyle=ready?palette.belly:'#f7fdff';ctx.fillRect(rect.x+2,y+2,rect.w-4,11);
          const text=!connected?'WAITING':ready?'READY':own?'YOU - NOT READY':'NOT READY';
          fitText(text,rect.x+rect.w/2,y+5,rect.w-8,.58,ready?palette.dark:'#59666b');
        }
      }
      function drawRoomMiddle(){
        const r=PVP_SETUP_UI.vsButton;ctx.fillStyle=COLORS.ink;ctx.fillRect(r.x,r.y,r.w,r.h);
        const a=getPvpSetupPreviewPalette(0),b=getPvpSetupPreviewPalette(1);
        ctx.fillStyle=a.mid;ctx.fillRect(r.x+2,r.y+2,r.w/2-2,r.h-4);
        ctx.fillStyle=b.mid;ctx.fillRect(r.x+r.w/2,r.y+2,r.w/2-2,r.h-4);
        drawMiniWifiIcon(r.x+r.w/2,r.y+r.h/2+1,COLORS.white);
      }
      function drawRoom(){drawPvpSetupScreen();const b=onlineButtons().find(b=>b.id==='profile');if(b)drawOnlineAction(b,state.focus==='profile');}
      function drawHud(){
        if(!state.active)return;
        const direct=directReady(),rtt=direct?net.peerRtt:state.rttMs,stale=isGuestActive()&&now()-state.lastSnapshotAt>RELAY.staleMs;
        const departedLabel=state.takeoverReason==='left'?'PLAYER LEFT':'PLAYER DISCONNECTED';
        let text=state.cpuIndex>=0?departedLabel+' - CPU LV 5':direct?'SERVER '+Math.round(rtt)+' MS':gate.lossAt?'RECONNECTING':gate.expectedDeparture?'PARTNER LEFT':gate.finishedOffline?'SERVER ENDED':'SERVER REQUIRED';
        if(stale&&state.cpuIndex<0)text='WAITING FOR HOST - LIVE';
        else if(net.correctionMessageUntil>now()&&state.cpuIndex<0)text='SHARED CATCH CORRECTED';
        const r={x:localIndex()===0?12:W-124,y:236,w:112,h:8};
        ctx.save();ctx.globalAlpha=.94;ctx.fillStyle=stale&&state.cpuIndex<0?'#f8c7cc':'#f7fdff';ctx.fillRect(r.x,r.y,r.w,r.h);
        fitText(text,r.x+r.w/2,r.y+2,r.w-6,.48,stale&&state.cpuIndex<0?'#8c3048':'#52666b');ctx.restore();
        if(state.cpuIndex>=0&&state.takeoverNoticeUntil>now()){
          const panel={x:126,y:39,w:228,h:37};
          ctx.save();ctx.globalAlpha=.96;
          ctx.fillStyle='rgba(38,54,61,.32)';ctx.fillRect(panel.x+3,panel.y+3,panel.w,panel.h);
          ctx.fillStyle=COLORS.ink;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);
          ctx.fillStyle='#f7fdff';ctx.fillRect(panel.x+3,panel.y+3,panel.w-6,panel.h-6);
          ctx.fillStyle='#b62e43';ctx.fillRect(panel.x+5,panel.y+5,panel.w-10,8);
          drawBitmapText(departedLabel,W/2,panel.y+6,1.03,'center','#ffffff','#6b1726');
          drawBitmapText('CPU LEVEL 5 TAKES OVER',W/2,panel.y+21,.67,'center','#48555a');
          ctx.restore();
        }
      }
      function menuKey(e){if(friendsGameInputLocked())return false;return onlineMenuKey(e);}
      function pointerDown(e){if(friendsGameInputLocked())return false;return onlinePointerDown(e);}
      function pointerMove(e){if(friendsGameInputLocked())return false;return onlinePointerMove(e);}
      document.addEventListener('keydown',e=>{
        if(friendsGameInputLocked())return;
        if(state.active&&e.code==='KeyP'){
          e.preventDefault();e.stopImmediatePropagation();
          if(!e.repeat)showExitMenu();
          return;
        }
        if(exitMenuKey(e))return;
        if(state.active&&['Pause','KeyR'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
      },{capture:true,passive:false});
      document.addEventListener('keydown',menuKey,{capture:true,passive:false});
      document.addEventListener('keyup',e=>{if(friendsGameInputLocked())return;if(isMenuVisible()||watch.active){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
      document.addEventListener('paste',e=>{
        if(state.screen==='profile'&&state.focus==='name'){e.preventDefault();onlineIdentity.draft=cleanOnlineName(e.clipboardData?.getData('text')||'');}
        else if(state.screen==='join'&&state.codeFocused){e.preventDefault();state.codeText=String(e.clipboardData?.getData('text')||'').toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,5);}
        else if(state.screen==='spectateList'&&watch.codeFocus){e.preventDefault();watch.code=String(e.clipboardData?.getData('text')||'').toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,5);}
      });
      canvas.addEventListener('pointerdown',e=>{
        if(friendsGameInputLocked())return;
        if(pointerDown(e))return;
        if(state.active&&pointInsideRect(getCanvasPoint(e),HUD_UI.pauseButton)){e.preventDefault();e.stopImmediatePropagation();showExitMenu();return;}
        if(state.active&&game.state==='playing'&&!pointInsideRect(getCanvasPoint(e),HUD_UI.pauseButton)){
          e.preventDefault();e.stopImmediatePropagation();handleControlDown({code:'PointerJump',preventDefault(){},stopPropagation(){}});
          try{canvas.setPointerCapture(e.pointerId);}catch(_){}
        }
      },{capture:true,passive:false});
      canvas.addEventListener('pointermove',pointerMove,{capture:true,passive:false});
      document.addEventListener('pointerup',e=>{if(friendsGameInputLocked())return;if(state.active&&state.heldControls.has('PointerJump')){
        e.preventDefault();e.stopImmediatePropagation();handleControlUp({code:'PointerJump',preventDefault(){},stopPropagation(){}});
      }},{capture:true,passive:false});
      window.addEventListener('blur',releaseHeldControl);
      document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseHeldControl();else if(state.connected)scheduleExchange(0);});
      window.RibbitRaceCancelOnlineActivities=()=>{cancelDirectPreflight();quick.generation++;state.generation++;state.busy=false;if(quick.queued)cancelQuickplay();if(watch.active)stopSpectating();if(state.connected)leaveRoom();};
      return {isQuickplay,quickRoundStage,quickVictoryAction,quickSecondsLeft,quickVictoryLabel,quickVictoryMessage,
        preparePromptPlan,choosePlannedTarget,resetRoundState:()=>resetRoundNetwork(currentRoundKey()),rememberLaunch,rememberTongueContact,predictCatch,authoritativeCatch,afterSimulationStep,pumpTransport,displayPlayer,directReady,
        checkDirectHealth,
        predictionHolding:()=>net.predictionHold,
        open,closeOverlay,leaveRoom,returnToLobby,isActive,isGuestActive,isHostActive,hasRoom,isRoomMenu,isMenuVisible,
        isQuickplayMenu:()=>['quickSelect','quickQueue','quickConnecting'].includes(state.screen),isQueueMenu:()=>state.screen==='quickQueue',menuMode:()=>state.screen,
        beginTongueAction,finishTongueAction,rememberWrongFly,wrongFlyBlocked,canStartCritical,synchronizedCountdown,drawSyncLabel,drawQueueBadge,
        isSpectating:()=>watch.active,updateSpectator,drawSpectator,
        isOverlayOpen:()=>false,handleControlDown,handleControlUp,isInputHeld,updateGuest,handleHostRoundCompletion,notifyNextRound,
        drawOnlineTooltip,drawOnlineLegacyAction,showExitMenu,drawExitMenu,preparingStart,leaveToHome,localIndex,settingsChanged,closeSettings,drawEntry,drawRoom,drawReadyBars,drawRoomMiddle,drawHud,statusText,roomPlayerLabel,
        roomCode:()=>state.roomCode,localReady:()=>state.localReady,remoteConnected:()=>state.remoteConnected,
        isHost:()=>state.role==='host',renderCorrection:renderCorrectionFor,
        diagnostic:()=>({lifecycleVersion:3,authorityRole:state.authorityRole,authorityVersion:state.authorityVersion,cpuIndex:state.cpuIndex,guestOnline:profile().guestMode,exitMenu:state.exitMenu,startSync:{key:syncClock.key,phase:syncClock.phase,loaded:syncClock.loaded,complete:syncClock.complete,goAt:syncClock.goAt,firstPlayAt:syncClock.firstPlayAt},spectating:watch.active,backgroundQueued:quick.queued&&quick.background,quickplayVersion:3,quickplay:state.quickplay,quickplayScreen:state.screen,quickplayCounts:quick.counts,quickplayRematch:quick.rematch,protocol:3,build:RIBBIT_DIRECT_BUILD,friendsEdition:true,serverTransport:true,friendsVersion:1,serverDirectVerified:gate.serverVerified,serverDirectVersion:gate.serverVersion,peerClockSynchronized:!!net.peerClockKnown,connectionAttempt:gate.offerAttempt,reconnectAttempts:gate.retries,socketState:net.socket?.readyState??3,droppedSnapshots:net.droppedSnapshots||0,googleRelayAllowed:false,connectionPhase:gate.phase,directFailure:gate.failure,peerLastError:net.peerError||'',preflight:gate.preflight,peerVerified:net.peerVerified,localVerified:net.localVerified,selectedCandidateTypes:net.pathTypes,directPingReplies:net.pingReplies,transport:state.cpuIndex>=0?'local-cpu':directReady()?'cloudflare-websocket':'disconnected',peerState:net.peer?.connectionState||'unavailable',peerRttMs:Math.round(net.peerRtt),predictedCatches:net.predictedCatches.length,claimAck:net.claimAck,claimsAccepted:net.diagnosticClaims.accepted,claimsRejected:net.diagnosticClaims.rejected,remoteJumpReplaying:!!net.remotePlay,workerClock:!!net.worker,role:state.role,screen:state.screen,connected:state.connected,active:state.active,
          roomCode:state.roomCode,ready:state.localReady,remoteReady:state.remoteReady,localSkin:state.localSkinId,remoteSkin:state.remoteSkinId,
          rttMs:Math.round(state.rttMs),serverMs:state.serverMs,snapshotAgeMs:state.role==='guest'&&state.lastSnapshotAt?Math.round(now()-state.lastSnapshotAt):null,
          receivedSnapshots:state.receivedSnapshotCount,inFlight:state.requestInFlight,pendingInputs:state.pendingInputEvents.length,
          acknowledged:state.acknowledgedGuestInputSequence,matchId:state.resultMatchId,startSequence:state.startSequenceSeen,lobbyEpoch:state.lobbyEpoch,message:state.message})};
    })();

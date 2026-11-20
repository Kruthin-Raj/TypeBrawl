import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testBombPass() {
  console.log('Testing Bomb Pass game mode...');

  const p1 = io('http://localhost:4000');
  const p2 = io('http://localhost:4000');

  await new Promise((res) => p1.on('connect', res));
  await new Promise((res) => p2.on('connect', res));
  console.log('Connected p1 and p2 sockets');

  // 1. P1 creates bomb-pass room
  const createRes = await new Promise((res) => {
    p1.emit(
      'room:create',
      {
        settings: {
          mode: 'bomb-pass',
          difficulty: 'easy',
          timerSec: 3,
          rounds: 5,
          maxPlayers: 4,
          isPublic: true
        },
        player: { nickname: 'Alice', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      res
    );
  });

  console.log('Create room result:', createRes);
  const code = createRes.roomCode;

  // 2. P2 joins room
  const joinRes = await new Promise((res) => {
    p2.emit(
      'room:join',
      {
        roomCode: code,
        player: { nickname: 'Bob', avatar: { color: '#10B981', eyes: 1, mouth: 1, accessory: 0 } }
      },
      res
    );
  });
  console.log('Join room result:', joinRes);

  let p1State = null;
  let p2State = null;
  p1.on('room:state', (s) => (p1State = s));
  p2.on('room:state', (s) => (p2State = s));

  // 3. P1 starts game
  console.log('Starting game...');
  p1.emit('room:start');

  // Wait for round 1 to start
  const round1 = await new Promise((res) => {
    p1.on('game:round_start', res);
  });
  console.log('Round 1 started:', round1);
  console.log('Active Turn Player ID:', round1.currentTurnPlayerId);

  const isP1Turn = round1.currentTurnPlayerId === p1.id;
  const turnSocket = isP1Turn ? p1 : p2;
  const nonTurnSocket = isP1Turn ? p2 : p1;

  // 4. Non-turn player tries to submit
  const invalidSubmit = await new Promise((res) => {
    nonTurnSocket.emit('game:submit_word', round1.word, res);
  });
  console.log('Non-turn submit result (expected false):', invalidSubmit);

  // 5. Turn player submits correct word
  const validSubmit = await new Promise((res) => {
    turnSocket.emit('game:submit_word', round1.word, res);
  });
  console.log('Turn submit result (expected true):', validSubmit);

  // 6. Wait for round 2 to start and verify turn passed!
  const round2 = await new Promise((res) => {
    p1.on('game:round_start', res);
  });
  console.log('Round 2 started:', round2);
  console.log('New Turn Player ID:', round2.currentTurnPlayerId);

  const passedSuccessfully = round2.currentTurnPlayerId !== round1.currentTurnPlayerId;
  console.log('Bomb passed to next player?:', passedSuccessfully);

  p1.disconnect();
  p2.disconnect();

  if (passedSuccessfully && validSubmit.correct && !invalidSubmit.correct) {
    console.log('>>> BOMB PASS TEST PASSED 100%! <<<');
    process.exit(0);
  } else {
    console.error('>>> BOMB PASS TEST FAILED <<<');
    process.exit(1);
  }
}

testBombPass().catch((err) => {
  console.error(err);
  process.exit(1);
});

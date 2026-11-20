import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testBombDetonate() {
  console.log('Testing Bomb Detonation on timeout...');

  const p1 = io('http://localhost:4000');
  const p2 = io('http://localhost:4000');

  await new Promise((res) => p1.on('connect', res));
  await new Promise((res) => p2.on('connect', res));

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

  await new Promise((res) => {
    p2.emit(
      'room:join',
      {
        roomCode: createRes.roomCode,
        player: { nickname: 'Bob', avatar: { color: '#10B981', eyes: 1, mouth: 1, accessory: 0 } }
      },
      res
    );
  });

  let bombDetonatedMsg = null;
  p1.on('chat:message', (msg) => {
    if (msg.senderName === 'BOMB PASS') {
      console.log('Received system chat message:', msg.text);
      bombDetonatedMsg = msg;
    }
  });

  p1.emit('room:start');

  const round1 = await new Promise((res) => p1.on('game:round_start', res));
  console.log('Round 1 active player:', round1.currentTurnPlayerId);

  // Neither player submits! Wait for round 1 to expire (3s timer + 3.5s round end delay)
  console.log('Waiting for bomb to explode on timeout...');
  const round2 = await new Promise((res) => p1.on('game:round_start', res));
  console.log('Round 2 started! Active player:', round2.currentTurnPlayerId);

  const state = await new Promise((res) => p1.once('room:state', res));
  const victim = state.players[round1.currentTurnPlayerId];
  console.log(`Victim ${victim.nickname} lives: ${victim.lives} (expected 2)`);

  p1.disconnect();
  p2.disconnect();

  if (victim.lives === 2 && bombDetonatedMsg && bombDetonatedMsg.text.includes('💥 BOOM!')) {
    console.log('>>> BOMB DETONATION TEST PASSED 100%! <<<');
    process.exit(0);
  } else {
    console.error('>>> BOMB DETONATION TEST FAILED <<<');
    process.exit(1);
  }
}

testBombDetonate().catch((err) => {
  console.error(err);
  process.exit(1);
});

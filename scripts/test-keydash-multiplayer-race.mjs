import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testKeyDashMultiplayerRace() {
  console.log('--- Testing KeyDash Multiplayer Real-Time Paragraph Sprint ---');
  const socket = io('http://localhost:4000');
  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Connected to server');

  let currentState = null;
  socket.on('room:state', (s) => {
    currentState = s;
  });

  // 1. Create Room in keydash-race mode
  const createRes = await new Promise((resolve) => {
    socket.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 10,
          rounds: 1,
          maxPlayers: 8,
          isPublic: true
        },
        player: { nickname: 'SpeedDemon', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      resolve
    );
  });
  console.log('1. Created keydash-race room:', createRes.roomCode);

  // 2. Add 1 bot
  socket.emit('room:add_bot');
  await new Promise((r) => setTimeout(r, 200));

  // 3. Start Race
  socket.emit('room:start');
  console.log('2. Emitted room:start');

  // Wait for countdown to finish and race to launch
  while (!currentState || currentState.status !== 'in-game') {
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('3. Race launched!');
  console.log(`Race Paragraph: "${currentState.currentWord}"`);
  const wordCount = currentState.currentWord.trim().split(/\s+/).length;
  console.log(`Paragraph Word Count: ${wordCount}`);
  if (wordCount < 10) {
    throw new Error(`Expected a full paragraph for KeyDash, but got only ${wordCount} words!`);
  }
  console.log('✓ Verified: KeyDash uses a full paragraph based on selected difficulty!');

  // 4. Test real-time progress update
  console.log('4. Emitting 50% race progress...');
  socket.emit('game:race_progress', { progressPercent: 50, wpm: 82, accuracy: 97 });
  await new Promise((r) => setTimeout(r, 300));

  const me = currentState.players[socket.id];
  console.log(`My progress on server: ${me?.progressPercent}%, WPM: ${me?.wpm}, ACC: ${me?.accuracy}%`);
  if (me?.progressPercent !== 50 || me?.wpm !== 82 || me?.accuracy !== 97) {
    throw new Error('Server did not update real-time progress metrics!');
  }
  console.log('✓ Verified: Real-time progress, speed, and accuracy tracked on server!');

  // 5. Complete race
  console.log('5. Emitting 100% race finish...');
  socket.emit('game:race_progress', { progressPercent: 100, wpm: 85, accuracy: 98 });
  await new Promise((r) => setTimeout(r, 400));

  const finishedMe = currentState.players[socket.id];
  console.log(`Finish status: ${finishedMe?.status}, Finish Rank: ${finishedMe?.finishRank}`);
  if (finishedMe?.finishRank !== 1) {
    throw new Error(`Expected finishRank to be 1, got ${finishedMe?.finishRank}`);
  }
  console.log('✓ Verified: 1st Place rank awarded to first player across finish line!');

  socket.disconnect();
  console.log('ALL KEYDASH MULTIPLAYER TESTS PASSED! 🎉');
  process.exit(0);
}

testKeyDashMultiplayerRace().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

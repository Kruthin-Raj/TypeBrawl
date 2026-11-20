import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testGameStartFix() {
  console.log('--- Testing Game Start Fix ---');
  const socket = io('http://localhost:4000');
  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Connected to server');

  let currentState = null;
  socket.on('room:state', (s) => {
    currentState = s;
  });

  // 1. Create Room (Landing Page)
  const createRes = await new Promise((resolve) => {
    socket.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 8,
          isPublic: true
        },
        player: { nickname: 'HostUser', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      resolve
    );
  });
  console.log('1. Room created:', createRes.roomCode);

  // 2. Simulate /play/[code] mount: socket.emit('room:join')
  const joinRes = await new Promise((resolve) => {
    socket.emit(
      'room:join',
      {
        roomCode: createRes.roomCode,
        player: { nickname: 'HostUser', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      resolve
    );
  });
  console.log('2. Room joined on page mount, success:', joinRes.success);
  await new Promise((r) => setTimeout(r, 200));

  if (!currentState) {
    throw new Error('currentState is null!');
  }

  // Verify host still has isHost = true
  const me = currentState.players[socket.id];
  if (!me || !me.isHost) {
    throw new Error(`Host lost isHost status after join! isHost=${me?.isHost}`);
  }
  console.log('✓ Verified: Host retained isHost = true after page mount.');

  // 3. Emit room:start
  console.log('3. Emitting room:start...');
  socket.emit('room:start');

  // Wait for countdown / in-game state
  await new Promise((r) => setTimeout(r, 800));
  console.log(`4. Room status after start: ${currentState.status}`);
  if (currentState.status !== 'countdown' && currentState.status !== 'in-game') {
    throw new Error(`Expected room status 'countdown' or 'in-game', but got '${currentState.status}'`);
  }
  console.log('✓ Verified: Game started successfully!');

  const playersAfterStart = Object.values(currentState.players);
  console.log(`Players in game: ${playersAfterStart.length} (${playersAfterStart.map((p) => p.nickname).join(', ')})`);
  if (playersAfterStart.length < 2) {
    throw new Error('Expected at least 2 players/bots in the match!');
  }
  console.log('✓ Verified: Match has player + bot opponent.');

  socket.disconnect();
  console.log('ALL FIX VERIFICATION TESTS PASSED! 🎉');
  process.exit(0);
}

testGameStartFix().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

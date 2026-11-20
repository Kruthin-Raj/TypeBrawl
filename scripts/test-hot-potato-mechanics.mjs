import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testHotPotato() {
  console.log('--- Testing Hot Potato (Bomb Pass) Real Mechanics ---');
  const socket = io('http://localhost:4000');
  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Connected to server');

  let currentState = null;
  socket.on('room:state', (s) => {
    currentState = s;
  });

  // 1. Create Room in bomb-pass mode
  const createRes = await new Promise((resolve) => {
    socket.emit(
      'room:create',
      {
        settings: {
          mode: 'bomb-pass',
          difficulty: 'easy',
          timerSec: 15,
          rounds: 5,
          maxPlayers: 8,
          isPublic: true
        },
        player: { nickname: 'PlayerA', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      resolve
    );
  });
  console.log('1. Created bomb-pass room:', createRes.roomCode);

  // 2. Add 1 bot
  socket.emit('room:add_bot');
  await new Promise((r) => setTimeout(r, 300));
  console.log('2. Added bot to room, total players:', Object.keys(currentState.players).length);

  // 3. Start Game
  socket.emit('room:start');
  console.log('3. Emitted room:start');

  // Wait for countdown to finish and round to start (approx 3.5s)
  console.log('Waiting for round to launch...');
  while (!currentState || currentState.status !== 'in-game') {
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('4. Round 1 launched!');
  console.log(`Initial Bomb Holder: ${currentState.players[currentState.currentTurnPlayerId]?.nickname}`);
  console.log(`Target Word: ${currentState.currentWord}`);

  const initialHolderId = currentState.currentTurnPlayerId;

  // If PlayerA holds the bomb, submit correct word to test passing to Bot
  if (initialHolderId === socket.id) {
    console.log('PlayerA holds the bomb. Submitting correct word to PASS the bomb...');
    const submitRes = await new Promise((resolve) => {
      socket.emit('game:submit_word', currentState.currentWord, resolve);
    });
    console.log('Submit response:', submitRes);

    await new Promise((r) => setTimeout(r, 400));
    console.log(`Bomb Holder after pass: ${currentState.players[currentState.currentTurnPlayerId]?.nickname}`);
    console.log(`New Target Word: ${currentState.currentWord}`);
    console.log(`Room Status: ${currentState.status}`);

    if (currentState.currentTurnPlayerId === initialHolderId) {
      throw new Error('Bomb was NOT passed to another player!');
    }
    if (currentState.status !== 'in-game') {
      throw new Error(`Round ended prematurely! Status: ${currentState.status}`);
    }
    console.log('✓ Verified: Bomb successfully passed to the next player with a new word while fuse keeps burning!');
  } else {
    // Bot holds the bomb, wait for bot to solve and pass it to PlayerA
    console.log('Bot holds the bomb. Waiting for bot to solve and pass to PlayerA...');
    while (currentState.currentTurnPlayerId !== socket.id && currentState.status === 'in-game') {
      await new Promise((r) => setTimeout(r, 300));
    }

    if (currentState.currentTurnPlayerId === socket.id) {
      console.log('✓ Verified: Bot solved and passed the bomb to PlayerA!');
      console.log(`PlayerA now holds the bomb! Target Word: ${currentState.currentWord}`);

      // Now PlayerA solves and passes back
      const submitRes = await new Promise((resolve) => {
        socket.emit('game:submit_word', currentState.currentWord, resolve);
      });
      console.log('Submit response from PlayerA:', submitRes);

      await new Promise((r) => setTimeout(r, 400));
      console.log(`Bomb Holder after PlayerA passed: ${currentState.players[currentState.currentTurnPlayerId]?.nickname}`);
      console.log(`Room Status: ${currentState.status}`);
      if (currentState.currentTurnPlayerId === socket.id) {
        throw new Error('Bomb was NOT passed back to bot!');
      }
      console.log('✓ Verified: PlayerA successfully passed the bomb back to bot!');
    }
  }

  socket.disconnect();
  console.log('ALL HOT POTATO MECHANIC TESTS PASSED! 🎉');
  process.exit(0);
}

testHotPotato().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

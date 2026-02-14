import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8088/api';
const TEAM_ID = '0';

async function runTest() {
    // 1. Create a board
    console.log('Creating board...');
    const createRes = await fetch(`${BASE_URL}/boards`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            teamId: TEAM_ID,
            title: 'Test Board Favorites',
            type: 'private'
        })
    });

    if (!createRes.ok) {
        console.error('Failed to create board', await createRes.text());
        return;
    }

    const board = await createRes.json();
    console.log('Board created:', board.id);

    // 2. Toggle favorite (ON)
    console.log('Toggling favorite (ON)...');
    const toggleRes1 = await fetch(`${BASE_URL}/boards/${board.id}/toggle-favorite`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    });

    if (!toggleRes1.ok) {
        console.error('Failed to toggle favorite', await toggleRes1.text());
        return;
    }

    const toggleData1 = await toggleRes1.json();
    console.log('Toggle response 1:', toggleData1);
    if (!toggleData1.isFavorite) {
        console.error('❌ Expected isFavorite to be true');
    } else {
        console.log('✅ Board marked as favorite');
    }

    // 3. List boards and verify
    console.log('Listing boards...');
    const listRes = await fetch(`${BASE_URL}/teams/${TEAM_ID}/boards`);
    const boards = await listRes.json();
    const fetchedBoard = boards.find((b: any) => b.id === board.id);

    if (fetchedBoard?.isFavorite) {
        console.log('✅ Verified: Board is marked as favorite in list');
    } else {
        console.error('❌ Failed: Board is NOT marked as favorite in list', fetchedBoard);
    }

    // 4. Toggle favorite (OFF)
    console.log('Toggling favorite (OFF)...');
    const toggleRes2 = await fetch(`${BASE_URL}/boards/${board.id}/toggle-favorite`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    });
    const toggleData2 = await toggleRes2.json();
    console.log('Toggle response 2:', toggleData2);

    if (toggleData2.isFavorite) {
        console.error('❌ Expected isFavorite to be false');
    } else {
        console.log('✅ Board unfavorited successfully');
    }

    // 5. Cleanup
    console.log('Cleaning up...');
    await fetch(`${BASE_URL}/boards/${board.id}`, {method: 'DELETE'});
    console.log('Done.');
}

runTest().catch(console.error);

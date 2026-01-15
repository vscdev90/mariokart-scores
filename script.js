document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('player-name');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playersList = document.getElementById('players-list');
    const raceCountSelect = document.getElementById('race-count');
    const racesContainer = document.getElementById('races-container');

    let players = JSON.parse(localStorage.getItem('players')) || [];
    let races = JSON.parse(localStorage.getItem('races')) || [];

    const savePlayers = () => {
        localStorage.setItem('players', JSON.stringify(players));
    };

    const saveRaces = () => {
        localStorage.setItem('races', JSON.stringify(races));
    };

    const renderRaces = () => {
        const raceCount = parseInt(raceCountSelect.value, 10);
        let tableHTML = '<table><thead><tr><th>Race</th><th>Datum</th><th>Winnaar</th></tr></thead><tbody>';

        for (let i = 1; i <= raceCount; i++) {
            const raceData = races[i - 1] || { date: '', winner: '' };
            tableHTML += `
                <tr>
                    <td>${i}</td>
                    <td><input type="date" class="race-date" data-race-id="${i}" value="${raceData.date}"></td>
                    <td>
                        <select class="winner-select" data-race-id="${i}">
                            <option value="">-- Kies winnaar --</option>
                            ${players.map(p => `<option value="${p}" ${p === raceData.winner ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </td>
                </tr>
            `;
        }

        tableHTML += '</tbody></table>';
        racesContainer.innerHTML = tableHTML;

        // Voeg event listeners toe nadat de tabel in de DOM is
        document.querySelectorAll('.race-date, .winner-select').forEach(input => {
            input.addEventListener('change', (e) => {
                const raceId = parseInt(e.target.dataset.raceId, 10);
                if (!races[raceId - 1]) {
                    races[raceId - 1] = { date: '', winner: '' };
                }
                if (e.target.classList.contains('race-date')) {
                    races[raceId - 1].date = e.target.value;
                } else {
                    races[raceId - 1].winner = e.target.value;
                }
                saveRaces();
            });
        });
    };

    const renderPlayers = () => {
        playersList.innerHTML = '';
        players.forEach((player, index) => {
            const li = document.createElement('li');
            li.textContent = player;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Verwijder';
            deleteBtn.addEventListener('click', () => {
                const deletedPlayer = players[index];
                players.splice(index, 1);

                // Wis de winnaar in races die door de verwijderde speler zijn gewonnen
                races.forEach(race => {
                    if (race && race.winner === deletedPlayer) {
                        race.winner = '';
                    }
                });

                savePlayers();
                saveRaces();
                renderPlayers();
                renderRaces(); // Update winnaar dropdowns
            });

            li.appendChild(deleteBtn);
            playersList.appendChild(li);
        });
    };

    addPlayerBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName && !players.includes(playerName)) {
            players.push(playerName);
            playerNameInput.value = '';
            savePlayers();
            renderPlayers();
            renderRaces(); // Update winnaar dropdowns
        }
    });

    raceCountSelect.addEventListener('change', () => {
        renderRaces();
    });

    renderPlayers();
    renderRaces();
});

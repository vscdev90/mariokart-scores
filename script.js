document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('player-name');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playersList = document.getElementById('players-list');
    const raceCountSelect = document.getElementById('race-count');
    const racesContainer = document.getElementById('races-container');
    const githubUser = document.getElementById('github-user');
    const githubRepo = document.getElementById('github-repo');
    const githubPath = document.getElementById('github-path');
    const githubPat = document.getElementById('github-pat');
    const githubLoadBtn = document.getElementById('github-load-btn');
    const githubSaveBtn = document.getElementById('github-save-btn');
    const githubStatus = document.getElementById('github-status');

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

    const loadFromGitHub = async () => {
        const user = githubUser.value.trim();
        const repo = githubRepo.value.trim();
        const path = githubPath.value.trim();
        const pat = githubPat.value.trim();

        if (!user || !repo || !path || !pat) {
            githubStatus.textContent = 'Vul alle GitHub-velden in.';
            return;
        }

        githubStatus.textContent = 'Bezig met laden...';
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${pat}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                const jsonData = JSON.parse(content);

                players = jsonData.players || [];
                races = jsonData.races || [];

                savePlayers();
                saveRaces();
                renderPlayers();
                renderRaces();
                githubStatus.textContent = 'Gegevens succesvol geladen van GitHub!';
            } else if (response.status === 404) {
                githubStatus.textContent = 'Bestand niet gevonden. Sla de gegevens op om het aan te maken.';
            } else {
                githubStatus.textContent = `Fout bij laden: ${response.statusText}`;
            }
        } catch (error) {
            githubStatus.textContent = `Netwerkfout: ${error.message}`;
        }
    };

    githubLoadBtn.addEventListener('click', loadFromGitHub);

    const saveToGitHub = async () => {
        const user = githubUser.value.trim();
        const repo = githubRepo.value.trim();
        const path = githubPath.value.trim();
        const pat = githubPat.value.trim();

        if (!user || !repo || !path || !pat) {
            githubStatus.textContent = 'Vul alle GitHub-velden in.';
            return;
        }

        githubStatus.textContent = 'Bezig met opslaan...';
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
        const dataToSave = { players, races };
        const content = btoa(JSON.stringify(dataToSave, null, 2));

        try {
            // Stap 1: Probeer het bestand op te halen om de SHA te krijgen
            let sha = undefined;
            const getResponse = await fetch(url, {
                headers: { 'Authorization': `token ${pat}` }
            });
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            } else if (getResponse.status !== 404) {
                githubStatus.textContent = `Fout bij ophalen SHA: ${getResponse.statusText}`;
                return;
            }

            // Stap 2: Maak of update het bestand
            const putResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update Mario Kart scores op ${new Date().toISOString()}`,
                    content: content,
                    sha: sha // Voeg SHA toe als het bestand bestaat
                })
            });

            if (putResponse.ok) {
                githubStatus.textContent = 'Gegevens succesvol opgeslagen in GitHub!';
            } else {
                githubStatus.textContent = `Fout bij opslaan: ${putResponse.statusText}`;
            }
        } catch (error) {
            githubStatus.textContent = `Netwerkfout: ${error.message}`;
        }
    };

    githubSaveBtn.addEventListener('click', saveToGitHub);

    renderPlayers();
    renderRaces();
});

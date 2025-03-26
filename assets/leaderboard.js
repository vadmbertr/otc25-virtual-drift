async function fetchLeaderboard() {
    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("participants (id, first_name, last_name, affiliation), avg_distance")
        .order("avg_distance", { ascending: true });

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
    }

    populateTable(data);
}


function populateTable(data) {
    const tableBody = document.querySelector("#leaderboardTable tbody");
    tableBody.innerHTML = "";

    data.forEach((entry, index) => {
        let rankClass = "";
        if (index === 0) rankClass = "top1";
        if (index === 1) rankClass = "top2";
        if (index === 2) rankClass = "top3";

        const affiliation = entry.participants.affiliation ? `(${entry.participants.affiliation})` : "";
        const row = `<tr class="${rankClass}" data-id="${entry.participants.id}" data-name="${entry.participants.first_name} ${entry.participants.last_name}">
            <td>${index + 1}</td>
            <td>${entry.participants.first_name} ${entry.participants.last_name} ${affiliation}</td>
            <td>${entry.avg_distance}</td>
        </tr>`;

        tableBody.innerHTML += row;
    });

    const rows = tableBody.querySelectorAll("tr");
    rows.forEach((row) => {
        row.addEventListener("click", async function(event) {
            const participantId = row.getAttribute("data-id");
            const participantName = row.getAttribute("data-name");

            const popupWrapper = document.querySelector("#popup-wrapper");
            popupWrapper.removeAttribute("hidden");
            const popupContent = document.querySelector("#popup-content");
            popupContent.innerHTML = `<h3>${participantName} detailed results</h3>`;

            const { data, error } = await supabaseClient.rpc('get_participant_score', {
                p_id: participantId,
              });

            if (error) {
                console.error("Error fetching results:", error);
                return;
            }

            const table = document.createElement('table');
            popupContent.appendChild(table);

            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th>Round</th>
                <th>Score</th>
                <th></th>
            `;
            table.appendChild(headerRow);

            data.forEach(row => {
                const roundId = row.round_id;
                const dataRow = document.createElement('tr');
                dataRow.innerHTML = `
                    <td>${roundId}</td>
                    <td>${row.score}</td>
                    <td></td>
                `;
                table.appendChild(dataRow);

                const downloadLink = document.createElement('a');
                downloadLink.href = '#';
                downloadLink.textContent = 'Download predictions';
                downloadLink.addEventListener('click', async function(event) {
                    event.preventDefault();
                    
                    const { data, error } = await supabaseClient.rpc('get_latest_predictions', {
                        p_id: participantId,
                        r_id: roundId
                    });

                    if (error) {
                        console.error('Error fetching predictions:', error);
                        return;
                    }
                
                    const geojson = {
                        type: "FeatureCollection",
                        features: data.map(row => ({
                            type: "Feature",
                            properties: {
                                text: `${row.drifter_id}`
                            },
                            geometry: Terraformer.wktToGeoJSON(row.zone)
                        }))
                    };
                
                    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${participantName.replace(/ /g, "-")}_predictions_round_${roundId}.geojson`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
                dataRow.querySelector('td:last-child').appendChild(downloadLink);
            });
        });
    });
}

fetchLeaderboard();

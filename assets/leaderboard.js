async function fetchLeaderboard() {
    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("participants (first_name, last_name, affiliation), successes")
        .order("successes", { ascending: false });

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
        const row = `<tr class="${rankClass}">
            <td>${index + 1}</td>
            <td>${entry.participants.first_name} ${entry.participants.last_name} ${affiliation}</td>
            <td>${entry.successes}</td>
        </tr>`;

        tableBody.innerHTML += row;
    });
}

fetchLeaderboard();

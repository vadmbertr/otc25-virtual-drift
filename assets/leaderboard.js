// script.js

const SUPABASE_URL = 'https://bejcftxathhgnorothbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlamNmdHhhdGhoZ25vcm90aGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDM0MTksImV4cCI6MjA1NjkxOTQxOX0.-3zrtrT_-AQV-7YwD8K8WYbpY4M05YAsnm_CC_3KPkA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


async function fetchLeaderboard() {
    const { data, error } = await supabaseClient
        .from("leaderboard")
        .select("participants (first_name, last_name), successes")
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

        const row = `<tr class="${rankClass}">
            <td>${index + 1}</td>
            <td>${entry.participants.first_name}</td>
            <td>${entry.participants.last_name}</td>
            <td>${entry.successes}</td>
        </tr>`;

        tableBody.innerHTML += row;
    });
}

fetchLeaderboard();

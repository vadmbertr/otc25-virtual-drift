const SUPABASE_URL = 'https://bejcftxathhgnorothbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlamNmdHhhdGhoZ25vcm90aGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDM0MTksImV4cCI6MjA1NjkxOTQxOX0.-3zrtrT_-AQV-7YwD8K8WYbpY4M05YAsnm_CC_3KPkA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


async function getNextRound() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseClient
        .from('rounds')
        .select('day')
        .gte('day', today)
        .order('day', { ascending: true })
        .limit(1);
    
    if (error) {
        console.error('Error fetching next round:', error);
    }

    return data;
}


window.onclick = function (event) {
    const popup = document.getElementById("popup");
    if (event.target === popup) {
        closePopup();
    }
};


function updatePopupContent(newContent) {
    const popupText = document.getElementById("popup-text");
    popupText.innerHTML += `${newContent}`;
};


function closePopup() {
    document.getElementById("popup").style.display = "none";
};


window.onclick = function (event) {
    const popup = document.getElementById("popup");
    if (event.target === popup) {
        closePopup();
    }
};

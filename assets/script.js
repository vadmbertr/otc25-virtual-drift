const SUPABASE_URL = 'https://wusouxztqofazsevackj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2VscWtqcWlzcGZibXRoZ214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODY4MDQsImV4cCI6MjA1OTE2MjgwNH0.7mu8zgwXQcVwRltXdQzlCQGugWOAXDYICYh2RRL9cYE';
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


function updatePopupContent(newContent) {
    const popupText = document.getElementById("popup-content");
    popupText.innerHTML += `${newContent}`;
};


function closePopup() {
    document.getElementById('popup-wrapper').setAttribute("hidden", true);
};


window.onclick = function (event) {
    const popupWrapper = document.getElementById("popup-wrapper");
    if (event.target === popupWrapper) {
        closePopup();
    }
};

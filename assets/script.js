//const SUPABASE_URL = 'https://bejcftxathhgnorothbj.supabase.co';
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlamNmdHhhdGhoZ25vcm90aGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDM0MTksImV4cCI6MjA1NjkxOTQxOX0.-3zrtrT_-AQV-7YwD8K8WYbpY4M05YAsnm_CC_3KPkA';
const SUPABASE_URL = 'https://ssbpkjwusdkszngavdie.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYnBrand1c2Rrc3puZ2F2ZGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDg3ODksImV4cCI6MjA1Nzg4NDc4OX0.5L6R3LOBABoGE2HvrRnj0dAi5Mml6HpcHxP6TyJCOTA';
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

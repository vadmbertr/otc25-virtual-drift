// script.js

const SUPABASE_URL = 'https://bejcftxathhgnorothbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlamNmdHhhdGhoZ25vcm90aGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDM0MTksImV4cCI6MjA1NjkxOTQxOX0.-3zrtrT_-AQV-7YwD8K8WYbpY4M05YAsnm_CC_3KPkA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


function displayError(statusText, errorMessage) {
    console.error(errorMessage);
    statusText.className = 'error';
    statusText.innerText = errorMessage;
}


function validateForm(event) {
    let firstName = document.getElementById('firstName');
    let lastName = document.getElementById('lastName');
    let fileInput = document.getElementById('fileInput');
    let firstNameError = document.getElementById('firstNameError');
    let lastNameError = document.getElementById('lastNameError');
    let fileError = document.getElementById('fileError');

    firstNameError.style.display = 'none';
    lastNameError.style.display = 'none';
    emailError.style.display = 'none';
    fileError.style.display = 'none';

    if (!firstName.value.trim()) {
        firstNameError.style.display = 'block';
        return false;
    }

    if (!lastName.value.trim()) {
        lastNameError.style.display = 'block';
        return false;
    }

    if (!email.validity.valid) {
        emailError.style.display = 'block';
        return false;
    }

    if (!fileInput.files.length || (!fileInput.files[0].name.endsWith('.geojson'))) {
        fileError.style.display = 'block';
        return false;
    }

    return true;
}


function parseGeoJSON(geojson, roundId, participantId) {
    let error = null;
    const predictionData = [];

    if (!geojson || !Array.isArray(geojson.features)) {
        error = 'GeoJSON is not in expected format. Aborting...';
        return { predictionData, error };
    }

    geojson.features.forEach((feature, index) => {
        if (feature.geometry.type === 'Polygon') {
            const area = turf.area(feature) / 1e6;

            if (area > 1000) {
                predictionData.length = 0;
                error = `Polygon ${index + 1} is too large. Aborting...`;
                return;
            }

            const prediction = {
                drifter_id: feature.properties.text,
                round_id: roundId,
                participant_id: participantId,
                zone: Terraformer.geojsonToWKT(feature.geometry)
            };
            predictionData.push(prediction);

        } else {
            predictionData.length = 0;
            error = `Feature ${index + 1} is not a polygon. Aborting...`;
            return;
        }
    });

    return { data: predictionData, error: error };
}


document.getElementById('uploadForm').addEventListener('submit', async function(event) {  
    event.preventDefault(); // stops the page reload

    if (validateForm(event)) {

        const statusText = document.getElementById('status');
        statusText.innerText = 'Submitting...';
        
        const datetime = new Date();
        const year = datetime.getFullYear();
        const month = String(datetime.getMonth() + 1).padStart(2, '0'); 
        const day = String(datetime.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const { data: roundId, error: roundError } = await supabaseClient
            .from('rounds')
            .select('id')
            .eq('day', today);

        if (roundError) {
            displayError(statusText, roundError);
            return;
        }

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const file = document.getElementById('fileInput').files[0];

        let { data: participantId, error: participantError } = await supabaseClient
            .from('participants')
            .insert(
                { email: email, first_name: firstName, last_name: lastName }
            )
            .select('id');

        if (participantError) {
            let { data: participantId, error: participantError } = await supabaseClient
                .from('participants')
                .select('id')
                .eq('email', email);

            if (participantError) {
                displayError(statusText, participantError);
                return;
            }
        }

        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const geojson = JSON.parse(e.target.result);
                const { data: predictionData, error: parsingError } = parseGeoJSON(geojson, roundId[0].id, participantId[0].id);

                if (parsingError) {
                    displayError(statusText, parsingError);
                    return;
                }

                const { error: predictionError } = await supabaseClient
                    .from('predictions')
                    .insert(
                        predictionData
                    );

                if (predictionError) {
                    displayError(statusText, participantIdError);
                    return;
                }

            } catch (error) {
                displayError(statusText, error);
                return;
            }

            statusText.className = 'success';
            statusText.innerText = 'Submission successful!';
        };

        reader.readAsText(file);
    }
});

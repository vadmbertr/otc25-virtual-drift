async function populatePopupContent() {
    const data = await getNextRound();

    let popupText = 'The next round is not scheduled yet. Stay tuned!';

    if (data && data.length > 0) {
        const roundDate = new Date(data[0].day);
        const today = new Date();

        const isSameDay =
            roundDate.getFullYear() === today.getFullYear() &&
            roundDate.getMonth() === today.getMonth() &&
            roundDate.getDate() === today.getDate();

        if (isSameDay) {
            const nowDateTime = new Date(today);

            const target8AM = new Date(nowDateTime);
            target8AM.setHours(8, 0, 0, 0);

            const target6PM = new Date(nowDateTime);
            target6PM.setHours(18, 0, 0, 0);

            const currentTime = nowDateTime.getTime();

            if (currentTime < target8AM.getTime()) {
                const diffMillis = target8AM.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round will opened at 8:00 AM CET, in ${hours} hours and ${minutes} minutes`;
            } else if (currentTime < target6PM.getTime()) {
                const diffMillis = target6PM.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round will closed at 6:00 PM CET. ${hours} hours and ${minutes} minutes left!`;
            } else {
                const diffMillis = currentTime - target6PM.getTime();
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round closed at 6:00 PM CET, ${hours} hours and ${minutes} minutes ago.`;
            }
        } else {
            const dateString = new Intl.DateTimeFormat('en-GB', {
                day: 'numeric',
                month: 'long',
            }).format(roundDate);
            popupText = `The next round is scheduled for ${dateString}.`;
        }
    }

    updatePopupContent(popupText);
}


populatePopupContent();


function displayError(statusText, errorMessage) {
    console.error(errorMessage);
    statusText.className = 'error';
    statusText.innerText = errorMessage;
}


function validateForm(event) {
    let email = document.getElementById('email');
    let firstName = document.getElementById('firstName');
    let lastName = document.getElementById('lastName');
    let fileInput = document.getElementById('fileInput');
    let firstNameError = document.getElementById('firstNameError');
    let lastNameError = document.getElementById('lastNameError');
    let fileError = document.getElementById('fileError');

    emailError.style.display = 'none';
    firstNameError.style.display = 'none';
    lastNameError.style.display = 'none';
    fileError.style.display = 'none';

    if (!email.validity.valid) {
        emailError.style.display = 'block';
        return false;
    }

    if (!firstName.value.trim()) {
        firstNameError.style.display = 'block';
        return false;
    }

    if (!lastName.value.trim()) {
        lastNameError.style.display = 'block';
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

        const email = document.getElementById('email').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const affiliation = document.getElementById('affiliation').value;
        const file = document.getElementById('fileInput').files[0];

        let { data: participantId, error: participantError } = await supabaseClient
            .from('participants')
            .insert(
                { email: email, first_name: firstName, last_name: lastName, affiliation: affiliation }
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

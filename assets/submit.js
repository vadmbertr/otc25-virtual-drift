async function populatePopupContent() {
    const data = await getNextRound();

    const popupElem = document.getElementById('popup-wrapper');
    popupElem.classList.add('warning');
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

            const target12noon = new Date(nowDateTime);
            target12noon.setHours(12, 0, 0, 0);

            const target8PM = new Date(nowDateTime);
            target8PM.setHours(20, 0, 0, 0);

            const currentTime = nowDateTime.getTime();

            if (currentTime < target12noon.getTime()) {
                const diffMillis = target12noon.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round will opened at 12 noon CET. <br> Come back in ${hours} hours and ${minutes} minutes...`;
            } else if (currentTime < target8PM.getTime()) {
                const diffMillis = target8PM.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));

                popupElem.classList.add('ok');
                popupElem.classList.remove('warning');
                popupText = `Today round is opened! <br> It will closed at 8:00 PM CET: ${hours} hours and ${minutes} minutes left!`;

                const form = document.getElementById('uploadForm');
                const inputs = form.querySelectorAll('input');
                const button = form.querySelector('button');
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i].disabled = false;
                }
                button.disabled = false;
            } else {
                const diffMillis = currentTime - target8PM.getTime();
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round closed at 8:00 PM CET, ${hours} hours and ${minutes} minutes ago. <br> Check the <a href="./leaderboard.html">leaderboard</a>!`;
            }
        } else {
            const dateString = new Intl.DateTimeFormat('en-US', {
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
};


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


function parseGeoJSON(geojson, participantId, roundId, driftersMap) {
    let error = null;
    const predictionData = [];

    if (!geojson || !Array.isArray(geojson.features)) {
        error = 'GeoJSON is not in expected format. Aborting...';
        return { predictionData, error };
    }

    geojson.features.forEach((feature, index) => {
        if (!feature.properties.text) {
            predictionData.length = 0;
            error = `Feature ${index + 1} does not have a 'text' property. Aborting...`;
            return;
        }

        if (feature.geometry.type !== 'Point') {
            predictionData.length = 0;
            error = `Feature ${index + 1} is not a point. Aborting...`;
            return;
        }

        const drifterLongId = feature.properties.text;
        if (!driftersMap[drifterLongId]) {
            predictionData.length = 0;
            error = `Drifter ${drifterLongId} not found in the database. Aborting...`;
            return;
        }
        const drifterId = driftersMap[drifterLongId];

        const prediction = {
            participant_id: participantId,
            drifter_id: drifterId,
            round_id: roundId,
            position: Terraformer.geojsonToWKT(feature.geometry)
        };
        predictionData.push(prediction);
    });

    return { data: predictionData, error: error };
}


document.getElementById('uploadForm').addEventListener('submit', async function(event) {  
    event.preventDefault();

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

        await supabaseClient
            .from('participants')
            .insert(
                { email: email, first_name: firstName, last_name: lastName, affiliation: affiliation }
            );

        const { data: participantId, error: participantError } = await supabaseClient
            .from('participants')
            .select('id')
            .eq('email', email);

        if (participantError) {
            displayError(statusText, participantError);
            return;
        }

        const { data: drifters, error: drifterError } = await supabaseClient
            .from('drifters')
            .select('id, long_id');

        if (drifterError) {
            displayError(statusText, drifterError);
            return;
        }

        const driftersMap = {};
        drifters.forEach(drifter => {driftersMap[drifter.long_id] = drifter.id;});

        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const geojson = JSON.parse(e.target.result);
                const { data: predictionData, error: parsingError } = parseGeoJSON(geojson, participantId[0].id, roundId[0].id, driftersMap);

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
                    displayError(statusText, predictionError);
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

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
                popupText = `Today round will opened at 8:00 AM CET, visit the <a href="./submit.html">submission</a> page in ${hours} hours and ${minutes} minutes...`;
            } else if (currentTime < target6PM.getTime()) {
                const diffMillis = target6PM.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));

                popupText = `Today round is opened, <a href="./submit.html">submit your preditions</a>! It will closed at 6:00 PM CET: ${hours} hours and ${minutes} minutes left!`;

                const form = document.getElementById('uploadForm');
                const inputs = form.querySelectorAll('input');
                const button = form.querySelector('button');
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i].disabled = false;
                }
                button.disabled = false;
            } else {
                const diffMillis = currentTime - target6PM.getTime();
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round closed at 6:00 PM CET, ${hours} hours and ${minutes} minutes ago. Check the <a href="./leaderboard.html">leaderboard</a>!`;
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

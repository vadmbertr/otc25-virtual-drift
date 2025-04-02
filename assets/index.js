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

            const target12noon = new Date(nowDateTime);
            target12noon.setHours(12, 0, 0, 0);

            const target8PM = new Date(nowDateTime);
            target8PM.setHours(20, 0, 0, 0);

            const currentTime = nowDateTime.getTime();

            if (currentTime < target12noon.getTime()) {
                const diffMillis = target12noon.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
                popupText = `Today round will opened at 12 noon CET. <br> Visit the <a href="./submit.html">submission</a> page in ${hours} hours and ${minutes} minutes...`;
            } else if (currentTime < target8PM.getTime()) {
                const diffMillis = target8PM.getTime() - currentTime;
                const hours = Math.floor(diffMillis / (1000 * 60 * 60));
                const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));

                popupText = `Today round is opened, <a href="./submit.html">submit your preditions</a>! <br> It will closed at 8:00 PM CET: ${hours} hours and ${minutes} minutes left!`;
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

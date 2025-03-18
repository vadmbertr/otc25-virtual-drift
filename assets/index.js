async function populatePopupContent() {
    const data = await getNextRound();

    let popupText = 'The next round is not scheduled yet. Stay tuned!';

    if (data && data.length > 0) {
        const date = new Date(data[0].day);
        const dateString = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
        }).format(date);
        popupText = `The next round is scheduled for ${dateString}.`;
    }

    updatePopupContent(popupText);
}


populatePopupContent();

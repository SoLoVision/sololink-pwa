export async function displayResults(fetchedData) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ''; // Clear previous results

    fetchedData.forEach(item => {
        // Create a button for each streaming service
        const button = document.createElement("button");
        button.className = "streaming-button";

        // Create an image element for the streaming service
        const buttonImg = document.createElement("img");
        buttonImg.className = "streaming-button-image";
        buttonImg.src = `images/streaming_images/${item.serviceName}/streaming_image.png`; // Ensure these images exist

        // Set button onclick to open the streaming link
        button.onclick = () => window.open(item.link, '_blank');

        // Append the image to the button and the button to the container
        button.appendChild(buttonImg);
        resultsContainer.appendChild(button);
    });
}
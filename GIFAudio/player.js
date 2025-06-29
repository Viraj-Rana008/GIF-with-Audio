// Utility: Find position of delimiter in buffer
function findDelimiterPosition(buffer, delimiter) {
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i <= bytes.length - delimiter.length; i++) {
        let match = true;
        for (let j = 0; j < delimiter.length; j++) {
            if (bytes[i + j] !== delimiter[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }
    return -1;
}

// Main loader: now reads loop count from 2 bytes after delimiter
async function loadAndPlayFromFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const delimiter = new TextEncoder().encode('AUD');
    const delimiterPos = findDelimiterPosition(arrayBuffer, delimiter);

    if (delimiterPos === -1) {
        alert("Invalid file: Delimiter not found.");
        return;
    }

    const fullBytes = new Uint8Array(arrayBuffer);

    // Read loop count: 2 bytes after the delimiter
    const loopCountOffset = delimiterPos + delimiter.length;
    const loopCount = fullBytes[loopCountOffset] + (fullBytes[loopCountOffset + 1] << 8);

    // Slice the parts
    const gifBuffer = arrayBuffer.slice(0, delimiterPos);
    const audioBuffer = arrayBuffer.slice(loopCountOffset + 2); // after loop count

    const gifBlob = new Blob([gifBuffer], { type: 'image/gif' });
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // Set image source
    document.getElementById("gifPlayer").src = URL.createObjectURL(gifBlob);

    // Set audio player
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = URL.createObjectURL(audioBlob);

    let playCount = 0;
    const maxLoops = loopCount === 0 ? Infinity : loopCount + 1;

    audioPlayer.onended = () => {
        playCount++;
        if (playCount < maxLoops) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        }
    };

    audioPlayer.play();
}

// Setup file input
document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        loadAndPlayFromFile(file);
    }
});

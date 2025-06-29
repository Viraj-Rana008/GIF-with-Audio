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

// Build a minimal WAV header
function createWavBuffer(pcmBytes, sampleRate = 44100, numChannels = 1, bitDepth = 16) {
    const byteRate = sampleRate * numChannels * bitDepth / 8;
    const blockAlign = numChannels * bitDepth / 8;
    const wavHeaderSize = 44;
    const dataSize = pcmBytes.byteLength;
    const totalSize = wavHeaderSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    let offset = 0;

    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    function writeUint32(val) {
        view.setUint32(offset, val, true);
        offset += 4;
    }

    function writeUint16(val) {
        view.setUint16(offset, val, true);
        offset += 2;
    }

    writeString('RIFF');
    writeUint32(totalSize - 8); // ChunkSize
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16); // Subchunk1Size
    writeUint16(1);  // AudioFormat = PCM
    writeUint16(numChannels);
    writeUint32(sampleRate);
    writeUint32(byteRate);
    writeUint16(blockAlign);
    writeUint16(bitDepth);
    writeString('data');
    writeUint32(dataSize);

    // Copy PCM bytes
    new Uint8Array(buffer, wavHeaderSize).set(new Uint8Array(pcmBytes));

    return buffer;
}

async function loadAndPlayFromFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const delimiter = new TextEncoder().encode('AUD');
    const delimiterPos = findDelimiterPosition(arrayBuffer, delimiter);

    if (delimiterPos === -1) {
        alert("Invalid file: Delimiter not found.");
        return;
    }

    const fullBytes = new Uint8Array(arrayBuffer);

    // Read loop count (2 bytes after delimiter)
    const loopCountOffset = delimiterPos + delimiter.length;
    const loopCount = fullBytes[loopCountOffset] + (fullBytes[loopCountOffset + 1] << 8);

    // Slice parts
    const gifBuffer = arrayBuffer.slice(0, delimiterPos);
    const compressedPcm = arrayBuffer.slice(loopCountOffset + 2); // after loop count

    // Decompress raw PCM
    let rawPcm;
    try {
        rawPcm = pako.inflate(compressedPcm).buffer;
    } catch (e) {
        alert("Failed to decompress audio data.");
        return;
    }

    // Convert to WAV
    const wavBuffer = createWavBuffer(rawPcm);

    // Play GIF and audio
    const gifBlob = new Blob([gifBuffer], { type: 'image/gif' });
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    document.getElementById("gifPlayer").src = URL.createObjectURL(gifBlob);
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = URL.createObjectURL(wavBlob);

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

// File input listener
document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        loadAndPlayFromFile(file);
    }
});

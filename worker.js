self.addEventListener('message', (e) => {
    console.log("音楽WebWorkerに受信");
    const { command } = e.data;
    if (command === 'play') {
        console.log("command: play");
        postMessage({ command: 'playAudio' });
    }
});

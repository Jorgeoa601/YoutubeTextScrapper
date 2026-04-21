document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scrape-form');
    const urlInput = document.getElementById('video-url');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    const submitBtn = document.getElementById('submit-btn');
    const errorBox = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    const transcriptOut = document.getElementById('transcript-output');
    const copyBtn = document.getElementById('copy-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI State for new fetch
        errorBox.classList.add('hidden');
        transcriptOut.value = '';
        copyBtn.classList.add('hidden');

        // Trigger Loading State Loop
        submitBtn.disabled = true;
        btnText.textContent = "Scraping... Please wait";
        spinner.classList.remove('hidden');

        try {
            // Initiate Netlify Serverless fetch
            const response = await fetch('/.netlify/functions/scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: url })
            });

            const result = await response.json();

            // Self-Healing: Error validation
            if (!response.ok || result.status === 'error') {
                throw new Error(result.error || `Server returned ${response.status}`);
            }

            // Success State formatting and insertion
            transcriptOut.value = result.data.transcript;
            copyBtn.classList.remove('hidden');

        } catch (err) {
            // Graceful Error Mapping
            errorText.textContent = err.message || "An unexpected error occurred.";
            errorBox.classList.remove('hidden');
        } finally {
            // Restore default UI state
            submitBtn.disabled = false;
            btnText.textContent = "Extract Transcript";
            spinner.classList.add('hidden');
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(transcriptOut.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
        } catch (e) {
            console.error("Clipboard copy failed", e);
        }
    });
});

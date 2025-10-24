const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, title } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const videoInfo = await ytdl.getInfo(url);
        const videoTitle = title || videoInfo.videoDetails.title;

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Download and stream audio
        ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        }).pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed: ' + error.message });
    }
};

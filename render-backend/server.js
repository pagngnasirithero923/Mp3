const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Search for YouTube videos
        const searchResults = await yts(query);
        
        if (!searchResults.videos.length) {
            return res.status(404).json({ error: 'No results found' });
        }

        const video = searchResults.videos[0];

        // Construct response data
        const songData = {
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail,
            duration: video.timestamp,
            views: video.views,
            author: video.author.name,
            downloadUrl: `https://your-backend.herokuapp.com/api/download?url=${encodeURIComponent(video.url)}`
        };

        res.json(songData);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/download', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const videoInfo = await ytdl.getInfo(url);
        const videoTitle = videoInfo.videoDetails.title;

        // Set headers for download
        res.header({
            'Content-Disposition': `attachment; filename="${videoTitle}.mp3"`,
            'Content-Type': 'audio/mpeg',
        });

        // Download and stream audio
        ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        }).pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'KPH MP3 Downloader Backend is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on port ${PORT}`);
});

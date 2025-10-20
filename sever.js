const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// FFmpeg path set කරන්න
ffmpeg.setFfmpegPath(ffmpegPath);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Download history storage
let downloadHistory = [];

// MP3 Download endpoint
app.get('/download', async (req, res) => {
    try {
        const { url, format = 'mp3' } = req.query;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'YouTube URL is required'
            });
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid YouTube URL'
            });
        }

        console.log('Processing URL:', url);
        
        const videoInfo = await ytdl.getInfo(url);
        const videoDetails = videoInfo.videoDetails;

        // Video details
        const videoData = {
            title: videoDetails.title,
            duration: parseInt(videoDetails.lengthSeconds),
            thumbnail: videoDetails.thumbnails[0]?.url,
            author: videoDetails.author?.name
        };

        let downloadUrl = '';
        let quality = '';
        let filename = '';

        if (format === 'mp3') {
            // Get the best audio format
            const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
            const bestAudio = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' });
            
            if (!bestAudio) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No audio format available'
                });
            }

            downloadUrl = bestAudio.url;
            quality = '128kbps MP3';
            filename = `${videoData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.mp3`;
            
        } else {
            // Video formats
            const videoFormats = ytdl.filterFormats(videoInfo.formats, 'videoonly');
            let selectedFormat;

            if (['144', '240', '360', '480', '720', '1080'].includes(format)) {
                selectedFormat = videoFormats.find(f => f.qualityLabel === `${format}p`);
            } else if (format === 'mp4') {
                selectedFormat = videoFormats.find(f => f.container === 'mp4');
            } else if (format === 'webm') {
                selectedFormat = videoFormats.find(f => f.container === 'webm');
            }

            if (!selectedFormat) {
                selectedFormat = ytdl.chooseFormat(videoFormats, { quality: 'highest' });
            }

            downloadUrl = selectedFormat.url;
            quality = selectedFormat.qualityLabel || format.toUpperCase();
            filename = `${videoData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.${selectedFormat.container || 'mp4'}`;
        }

        const result = {
            ...videoData,
            format: format.toUpperCase(),
            quality: quality,
            download: downloadUrl,
            filename: filename
        };

        // Save to history
        downloadHistory.unshift({
            ...result,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        });

        // Keep only last 20 items
        if (downloadHistory.length > 20) {
            downloadHistory = downloadHistory.slice(0, 20);
        }

        res.json({
            status: 'success',
            data: result
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process download: ' + error.message
        });
    }
});

// History endpoints
app.get('/history', (req, res) => {
    res.json({
        status: 'success',
        data: downloadHistory
    });
});

app.post('/history', (req, res) => {
    const historyItem = {
        ...req.body,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
    };
    
    downloadHistory.unshift(historyItem);
    
    if (downloadHistory.length > 20) {
        downloadHistory = downloadHistory.slice(0, 20);
    }
    
    res.json({ status: 'success' });
});

app.delete('/history', (req, res) => {
    downloadHistory = [];
    res.json({ status: 'success' });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`🚀 ZEHax Downloader running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

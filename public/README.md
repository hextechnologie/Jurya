# Public Assets Folder

This folder contains static files that can be accessed directly from your website.

## How to Add Your Video:

1. **Download your video from YouTube** or use your original video file
2. **Copy the video file** to this folder
3. **Rename it to**: `demo.mp4` (or keep any name you want)
4. The video will be accessible at: `https://interview-coach-tau.vercel.app/demo.mp4`

## Current Setup:

The home page is configured to look for: `demo.mp4`

If you use a different filename, update the `src` attribute in `app/page.tsx`

## Supported Formats:

- `.mp4` (recommended - best browser support)
- `.webm` (good for web, smaller file size)
- `.mov` (works but larger file size)

## File Size Tips:

- Keep video under 50MB for fast loading
- Compress your video using tools like HandBrake
- Consider 720p or 1080p resolution (4K is too large)

## Next Steps:

1. Put your video file here as `demo.mp4`
2. Commit and push to GitHub
3. Vercel will automatically deploy it

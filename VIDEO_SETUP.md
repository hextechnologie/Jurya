# How to Add Your Demo Video

The home page has a video section ready for your demo video. Here are your options:

## Option 1: YouTube Video (Recommended)

1. Upload your video to YouTube
2. Get the video ID from the URL (e.g., `https://youtube.com/watch?v=ABC123` → ID is `ABC123`)
3. In `app/page.tsx`, find the video section (around line 85)
4. Uncomment the iframe code block and replace `YOUR_VIDEO_ID`:

```tsx
<iframe
  className="w-full h-full"
  src="https://www.youtube.com/embed/ABC123"
  title="Interview Coach Demo"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

## Option 2: Vimeo Video

Same as YouTube, but use:
```tsx
src="https://player.vimeo.com/video/YOUR_VIDEO_ID"
```

## Option 3: Direct Video File

1. Add your video file to `public/` folder (e.g., `public/demo.mp4`)
2. Create a thumbnail image (e.g., `public/demo-thumb.jpg`)
3. In `app/page.tsx`, uncomment the video tag and update paths:

```tsx
<video
  className="w-full h-full object-cover"
  controls
  poster="/demo-thumb.jpg"
>
  <source src="/demo.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

## Option 4: Loom Video

1. Record your video with Loom
2. Get the embed code
3. Replace the iframe src with the Loom embed URL

## Tips for Your Demo Video

✅ **Show**:
- Quick overview of the app (30-60 seconds)
- How to start an interview
- The AI asking questions
- Example feedback screen
- Dashboard with progress

✅ **Keep it**:
- Short (1-2 minutes max)
- High quality (1080p)
- Professional audio
- On-brand

✅ **Script ideas**:
"Hi, I'm [Name] and I'll show you how Interview Coach helps you ace your next job interview in just 60 seconds..."

## Current Placeholder

The placeholder has a play button and text. Once you add your video, comment out or delete the placeholder div (lines with "Placeholder - Replace with your actual video").

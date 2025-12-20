# Farcaster/Base App Setup Instructions

MyUSIC is ready for submission to Farcaster/Base App! Follow these steps to complete the setup:

## 1. Generate Account Association

Run the following command to generate your account association signature:

```bash
npx create-onchain --manifest
```

This will prompt you to:
- Sign with your Farcaster custody wallet (you can import it using your recovery phrase from Farcaster Settings → Advanced)
- Generate three environment variables: `FARCASTER_HEADER`, `FARCASTER_PAYLOAD`, and `FARCASTER_SIGNATURE`

## 2. Add Environment Variables

Add the generated variables to your Vercel project environment variables:

```
FARCASTER_HEADER=eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0
FARCASTER_PAYLOAD=eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ
FARCASTER_SIGNATURE=MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj
```

## 3. Create Required Images

Create the following images and place them in the `public` folder:

- `icon-1024.png` - App icon (1024×1024px, PNG, transparent background discouraged)
- `splash-200.png` - Loading splash image (200×200px recommended)
- `og-image.png` - Open Graph/Hero image (1200×630px, 1.91:1 ratio, PNG/JPG)
- `screenshot-1.png` - App screenshot 1 (portrait 1284×2778px recommended)
- `screenshot-2.png` - App screenshot 2 (portrait 1284×2778px recommended)
- `screenshot-3.png` - App screenshot 3 (portrait 1284×2778px recommended)

## 4. Verify Manifest

Once deployed, verify your manifest is accessible at:

```
https://myusic.xyz/.well-known/farcaster.json
```

Test with curl:
```bash
curl -sI https://myusic.xyz/.well-known/farcaster.json
```

## 5. Test in Base App

Before official submission:
1. Set `noindex: false` in production (currently set via `NODE_ENV`)
2. Share your app link in a Farcaster cast
3. Wait ~10 minutes for indexing to complete
4. Search for "MyUSIC" in Base App

## 6. Submission Checklist

- [x] Farcaster SDK integrated (`@farcaster/miniapp-sdk`)
- [x] FarcasterProvider wraps the app
- [x] Manifest route created at `/.well-known/farcaster.json`
- [x] Frame metadata added to layout for rich embeds
- [ ] Environment variables configured (FARCASTER_HEADER, FARCASTER_PAYLOAD, FARCASTER_SIGNATURE)
- [ ] All required images created and uploaded
- [ ] Manifest verified and accessible
- [ ] App tested in Base App

## Resources

- [Minikit Quickstart](https://docs.base.org/mini-apps/quickstart/new-apps/install)
- [Create Manifest Guide](https://docs.base.org/mini-apps/quickstart/new-apps/create-manifest)
- [Manifest Reference](https://docs.base.org/mini-apps/features/manifest)
- [Launch Checklist](https://docs.base.org/mini-apps/quickstart/launch-checklist)

## Current Status

✅ **Code is ready!** MyUSIC has all the technical requirements for Base App.

Next steps:
1. Run `npx create-onchain --manifest` to generate account association
2. Add environment variables to Vercel
3. Create and upload required images
4. Deploy and verify manifest
5. Test in Base App

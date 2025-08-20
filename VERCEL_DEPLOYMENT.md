# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup

You need to configure the following environment variable in your Vercel project:

#### **Required Environment Variable:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://brmh.in` | Your backend API URL |

### 2. How to Set Environment Variables in Vercel

#### **Method 1: Vercel Dashboard**
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: `https://brmh.in`
   - **Environment**: Select all environments (Production, Preview, Development)
5. Click **Save**

#### **Method 2: Vercel CLI**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variable
vercel env add NEXT_PUBLIC_BACKEND_URL

# When prompted, enter: https://brmh.in
```

### 3. Image Domains Configuration

✅ **Already configured** in `next.config.js`:
- `picsum.photos` - For placeholder images
- `images.unsplash.com` - For user avatars
- `randomuser.me` - For random user avatars
- `example.com` - For example URLs
- `localhost` - For local development

### 4. Deployment Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables** (as shown above)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### 5. Post-Deployment Verification

After deployment, verify:

1. **Homepage loads correctly** → Should redirect to `/dashboard`
2. **Dashboard loads** → All components should render properly
3. **Products page works** → Should load product data from backend
4. **Orders page works** → Should load order data from backend
5. **Images load** → All placeholder images should display correctly
6. **Search functionality** → Should work with Algolia integration

### 6. Troubleshooting

#### **Common Issues:**

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

2. **Environment Variables Not Working**
   - Ensure variable name starts with `NEXT_PUBLIC_` for client-side access
   - Redeploy after adding environment variables

3. **Images Not Loading**
   - Verify image domains are correctly configured in `next.config.js`
   - Check that image URLs are accessible

4. **API Calls Failing**
   - Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
   - Check that your backend is accessible from Vercel's servers

### 7. Performance Optimization

Your project is already optimized with:
- ✅ SWC minification enabled
- ✅ Console logs removed in production
- ✅ Image optimization with WebP/AVIF formats
- ✅ Proper TypeScript configuration
- ✅ Tailwind CSS optimization

### 8. Security Considerations

- ✅ Environment variables are properly configured
- ✅ No sensitive data in client-side code
- ✅ Backend URL uses HTTPS
- ✅ Console logs removed in production

## 🚀 Ready to Deploy!

Your project is fully configured for Vercel deployment. Just follow the steps above to set up the environment variable and deploy!

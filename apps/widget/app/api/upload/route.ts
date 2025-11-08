import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@workspace/auth';
import {
  configureCloudinary,
  uploadToCloudinary,
  type CloudinaryFolder
} from '@workspace/cloudinary';

// Configure Cloudinary on module load
configureCloudinary();

export async function POST(req: NextRequest) {
  console.log('📥 Upload API called');
   console.log('🔍 Environment check:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
    api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
  });
  
  try {
    // ✅ FIXED: Pass authOptions to getServerSession
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log('❌ Unauthorized - No session found');
      return NextResponse.json(
        { error: 'Please sign in to upload files' }, 
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderInput = formData.get('folder') as string;
    const folder = (folderInput || 'restaurants/documents') as CloudinaryFolder;

    console.log('📁 Folder:', folder);
    console.log('📄 File:', file?.name, file?.size, file?.type);

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('🔄 File converted to buffer, size:', buffer.length);

    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const result = await uploadToCloudinary(buffer, {
      folder,
      allowedFormats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      tags: [`user-${session.user.id}`, 'restaurant-document'],
      transformation: {
        quality: 'auto',
        format: 'jpg'
      }
    });

    console.log('✅ Upload successful:', result.publicId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
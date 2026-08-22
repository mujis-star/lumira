import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify token with Google's official tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error_description || 'Invalid Google ID token' },
        { status: 401 }
      );
    }

    const payload = await response.json();

    // Verify payload contents
    const { sub, email, name, picture, email_verified } = payload;

    if (!email) {
      return NextResponse.json({ error: 'Google account has no associated email' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: sub,
        email,
        displayName: name || email.split('@')[0],
        avatarUrl: picture || null,
        emailVerified: email_verified === 'true' || email_verified === true,
      },
    });
  } catch (error: unknown) {
    console.error('Error verifying Google token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error verifying token' },
      { status: 500 }
    );
  }
}

// app/api/clerk-users/route.ts
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList();
    
    // Filtrer seulement les enseignants
    const teachers = users.data.filter(user => {
      // Adaptez cette logique selon comment vous stockez le rôle dans Clerk
      return user.publicMetadata.role === 'Enseignant';
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching Clerk users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
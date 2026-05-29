import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
	if (!isPublicRoute(req)) {
		await auth.protect();
	}
	return NextResponse.next();
});

export const config = {
	matcher: ['/((?!.*\\..*|_next).*)', '/'],
};

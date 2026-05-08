import { Button } from '@/components/ui/button';
import { SignIn } from '@clerk/nextjs';

export default function Home() {
	return (
		<div>
			<h1>Hello world</h1>
			<Button>click me</Button>
			<div className="flex items-center justify-center min-h-screen">
				<SignIn />
			</div>
		</div>
	);
}

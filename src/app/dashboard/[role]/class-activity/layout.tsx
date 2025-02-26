interface LayoutProps {
	children: React.ReactNode;
	params: {
		role: string;
	};
}

export default function ClassActivityLayout({ children, params }: LayoutProps) {
	return (
		<div className="h-full flex-1 flex-col space-y-8 p-8 flex">
			{children}
		</div>
	);
}
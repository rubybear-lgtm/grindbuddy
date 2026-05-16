<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: ((e: MouseEvent) => void) | (() => void);
		children: any;
	}

	let {
		variant = 'primary',
		size = 'md',
		class: className = '',
		disabled = false,
		type = 'button',
		onclick,
		children
	}: Props = $props();

	const variantClasses = {
		primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm',
		secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border',
		ghost: 'hover:bg-accent hover:text-accent-foreground'
	};

	const sizeClasses = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-4 py-2 text-sm',
		lg: 'h-12 px-8 text-base'
	};

	function handleClick(e: MouseEvent) {
		if (disabled || !onclick) return;
		onclick(e);
	}
</script>

<button
	class="inline-flex items-center justify-center rounded-md font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none {variantClasses[variant]} {sizeClasses[size]} {className}"
	{disabled}
	onclick={handleClick}
	{type}
>
	{@render children()}
</button>


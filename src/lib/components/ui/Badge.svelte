<script lang="ts">
	interface Props {
		variant?: 'default' | 'status' | 'difficulty' | 'pattern';
		class?: string;
		children: any;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {variant === 'pattern' ? 'bg-white/5 text-muted-foreground border border-white/10' : ''} {className}"
>
	{@render children()}
</span>


<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';

	let {
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: SelectPrimitive.ItemProps = $props();
</script>

<SelectPrimitive.Item
	{value}
	class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted }: { selected: boolean; highlighted: boolean })}
		<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			{#if selected}
				<Check class="h-4 w-4" />
			{/if}
		</span>

		{#if typeof childrenProp === 'function'}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>

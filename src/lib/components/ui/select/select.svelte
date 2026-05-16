<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	let {
		value = $bindable(),
		open = $bindable(),
		...restProps
	}: SelectPrimitive.RootProps = $props();
</script>

<SelectPrimitive.Root bind:value={value as any} bind:open {...restProps}>
	{@render restProps.children?.()}
</SelectPrimitive.Root>

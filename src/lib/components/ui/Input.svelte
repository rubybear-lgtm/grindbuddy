<script lang="ts">
	import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		type?: string;
		name?: string;
		id?: string;
		placeholder?: string;
		value?: string;
		class?: string;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		name,
		id,
		placeholder = '',
		value = $bindable(),
		class: className = '',
		required = false,
		autocomplete,
		oninput,
		onkeydown
	}: Props = $props();
</script>

<input
	{type}
	{name}
	{id}
	{placeholder}
	bind:value
	{required}
	{autocomplete}
	class="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 {className}"
	oninput={oninput}
	onkeydown={onkeydown}
/>


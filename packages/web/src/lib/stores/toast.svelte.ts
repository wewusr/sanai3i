export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

let nextId = 1;

export const toasts = $state<Toast[]>([]);

export function toast(message: string, type: Toast['type'] = 'info') {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => dismissToast(id), 4000);
}

export function dismissToast(id: number) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i !== -1) toasts.splice(i, 1);
}

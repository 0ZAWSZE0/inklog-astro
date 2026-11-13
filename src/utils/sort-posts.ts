export type SortablePost = {
	slug: string;
	data: {
		published: Date;
	};
};

export function comparePostsByPublishedDesc(
	a: SortablePost,
	b: SortablePost,
): number {
	const dateDifference =
		b.data.published.getTime() - a.data.published.getTime();
	if (dateDifference !== 0) {
		return dateDifference;
	}

	if (a.slug < b.slug) {
		return -1;
	}
	if (a.slug > b.slug) {
		return 1;
	}
	return 0;
}

export function sortPostsByPublishedDesc<T extends SortablePost>(
	posts: readonly T[],
): T[] {
	return [...posts].sort(comparePostsByPublishedDesc);
}

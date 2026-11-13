import { describe, expect, it } from "vitest";
import {
	comparePostsByPublishedDesc,
	type SortablePost,
	sortPostsByPublishedDesc,
} from "./sort-posts";

function makePost(slug: string, published: string): SortablePost {
	return {
		slug,
		data: {
			published: new Date(`${published}T00:00:00.000Z`),
		},
	};
}

function slugsOf(posts: SortablePost[]): string[] {
	return posts.map((post) => post.slug);
}

describe("sortPostsByPublishedDesc", () => {
	it("sorts different publication dates in descending order", () => {
		const posts = [
			makePost("older", "2026-10-16"),
			makePost("newest", "2026-10-18"),
			makePost("middle", "2026-10-17"),
		];

		expect(slugsOf(sortPostsByPublishedDesc(posts))).toEqual([
			"newest",
			"middle",
			"older",
		]);
	});

	it("sorts posts with the same publication date by ascending slug", () => {
		const posts = [
			makePost("linux", "2026-10-17"),
			makePost("blog", "2026-10-17"),
			makePost("jvm", "2026-10-17"),
			makePost("collection", "2026-10-17"),
		];

		expect(slugsOf(sortPostsByPublishedDesc(posts))).toEqual([
			"blog",
			"collection",
			"jvm",
			"linux",
		]);
	});

	it("returns zero when comparing the same element", () => {
		const post = makePost("same-post", "2026-10-17");

		expect(comparePostsByPublishedDesc(post, post)).toBe(0);
		expect(
			comparePostsByPublishedDesc(
				makePost("same-post", "2026-10-17"),
				makePost("same-post", "2026-10-17"),
			),
		).toBe(0);
	});

	it("produces the same order across repeated builds and input permutations", () => {
		const posts = [
			makePost("linux", "2026-10-17"),
			makePost("blog", "2026-10-17"),
			makePost("jvm", "2026-10-17"),
			makePost("newest", "2026-10-18"),
			makePost("older", "2026-10-16"),
		];
		const expected = ["newest", "blog", "jvm", "linux", "older"];
		const permutations = [
			posts,
			[...posts].reverse(),
			[posts[2], posts[4], posts[0], posts[3], posts[1]],
		];

		for (const permutation of permutations) {
			for (let run = 0; run < 5; run++) {
				expect(slugsOf(sortPostsByPublishedDesc(permutation))).toEqual(
					expected,
				);
			}
		}
	});

	it("does not mutate the input array", () => {
		const posts = [
			makePost("second", "2026-10-16"),
			makePost("first", "2026-10-17"),
		];
		const originalSlugs = slugsOf(posts);
		const sorted = sortPostsByPublishedDesc(posts);

		expect(sorted).not.toBe(posts);
		expect(slugsOf(posts)).toEqual(originalSlugs);
		expect(slugsOf(sorted)).toEqual(["first", "second"]);
	});
});

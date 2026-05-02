type SeoOptions = {
    title: string;
    description: string;
    path?: string;
};

const SITE_URL = "https://giovanni.app";

export function createSeoMeta({ title, description, path = "/" }: SeoOptions) {
    const canonicalUrl = new URL(path, SITE_URL).toString();

    return [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
    ];
}

export function createCanonicalLink(path = "/") {
    return {
        rel: "canonical",
        href: new URL(path, SITE_URL).toString(),
    };
}

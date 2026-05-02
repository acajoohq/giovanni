import { createFileRoute } from "@tanstack/react-router";
import { createCanonicalLink, createSeoMeta } from "../lib/seo";

const toolPreviews = [
    {
        title: "Compress",
        description: "Reduce file size before sending documents by email or storing them in shared folders.",
    },
    {
        title: "Split",
        description: "Separate large PDFs into practical sections without sending the file to a server.",
    },
    {
        title: "Merge",
        description: "Bring pages and documents together in the order you choose.",
    },
    {
        title: "Extract Images",
        description: "Pull useful images out of PDFs for review, archiving, or reuse.",
    },
];

const principles = ["Readable at every age", "Keyboard friendly by default", "Private client-side processing", "No account required for core tools"];

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni | Simple PDF Tools for Everyone",
            description: "A warm, accessible PDF workspace for compressing, splitting, merging, and working with documents privately.",
        }),
        links: [createCanonicalLink()],
    }),
    component: HomePage,
});

function HomePage() {
    const toolPreviewCards = toolPreviews.map((tool) => (
        <article className="tool-card" key={tool.title}>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
        </article>
    ));

    const principleItems = principles.map((principle) => <li key={principle}>{principle}</li>);

    return (
        <main className="page-shell" id="main-content">
            <section className="hero-section" aria-labelledby="hero-heading">
                <div className="hero-copy">
                    <p className="eyebrow">Private PDF Work, Made Calm</p>
                    <h1 id="hero-heading">Giovanni helps everyone handle PDFs with confidence.</h1>
                    <p className="hero-lede">
                        A simple web app for everyday document tasks: clear language, generous controls, and PDF processing designed to stay close to your browser.
                    </p>
                    <div className="hero-actions" aria-label="Giovanni Highlights">
                        <a className="button-link" href="#tools">
                            Preview Tools
                        </a>
                        <a className="text-link" href="#privacy">
                            Read Privacy Promise
                        </a>
                    </div>
                </div>
                <aside className="hero-note" aria-label="Current Product Phase">
                    <span className="note-label">Phase 1</span>
                    <p>Giovanni starts as a fast, static, SEO-friendly home. Interactive PDF tools come next.</p>
                </aside>
            </section>

            <section className="section-grid" id="tools" aria-labelledby="tools-heading">
                <div>
                    <p className="eyebrow">Tool Foundation</p>
                    <h2 id="tools-heading">Built around the PDF features already in the workspace.</h2>
                </div>
                <div className="tool-grid">{toolPreviewCards}</div>
            </section>

            <section className="privacy-panel" id="privacy" aria-labelledby="privacy-heading">
                <div>
                    <p className="eyebrow">Privacy First</p>
                    <h2 id="privacy-heading">Documents should feel local, not lost.</h2>
                </div>
                <p>
                    The PDF engine will use the existing WebAssembly package so core work can happen in the browser. The interface will explain what is happening before a file is
                    processed.
                </p>
            </section>

            <section className="section-grid" id="roadmap" aria-labelledby="roadmap-heading">
                <div>
                    <p className="eyebrow">Design Promise</p>
                    <h2 id="roadmap-heading">Accessible enough for a first visit, polished enough for daily use.</h2>
                </div>
                <ul className="principle-list">{principleItems}</ul>
            </section>
        </main>
    );
}

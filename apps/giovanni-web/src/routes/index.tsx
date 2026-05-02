import { createFileRoute } from "@tanstack/react-router";
import { createSeoMeta } from "../lib/seo";

const tools = ["Compress", "Split", "Merge", "Extract Images"];
const principles = ["Readable controls", "Plain language", "Keyboard access", "Local-first processing"];

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni | Simple PDF Tools for Everyone",
            description: "A clear, accessible PDF workspace for everyday document work.",
        }),
    }),
    component: HomePage,
});

function HomePage() {
    const toolItems = tools.map((tool) => (
        <li className="rounded-2xl border border-stone-300 bg-white/50 px-5 py-4 text-lg font-bold text-stone-950" key={tool}>
            {tool}
        </li>
    ));

    const principleItems = principles.map((principle) => (
        <li className="rounded-2xl border border-stone-300 bg-stone-200/60 px-5 py-4 text-lg font-bold text-stone-950" key={principle}>
            {principle}
        </li>
    ));

    return (
        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-6 lg:px-8" id="main-content">
            <section
                className="grid scroll-mt-8 gap-10 rounded-4xl border border-stone-300 bg-white/50 p-6 shadow-2xl backdrop-blur md:p-10 lg:p-14"
                aria-labelledby="hero-heading"
            >
                <div className="flex max-w-4xl flex-col items-start gap-6">
                    <p className="m-0 text-sm font-black uppercase leading-5 tracking-[0.22em] text-orange-900">Private PDF Work</p>
                    <h1 className="m-0 text-balance font-serif text-5xl leading-tight tracking-[-0.03em] text-stone-950 sm:text-6xl lg:text-7xl" id="hero-heading">
                        PDF tools that feel calm, readable, and close at hand.
                    </h1>
                    <p className="m-0 max-w-2xl text-xl leading-9 text-stone-600">
                        Giovanni is for everyday document tasks: fewer choices to decode, larger controls to trust, and browser-based PDF processing.
                    </p>
                    <a
                        className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-base font-black text-stone-50 no-underline shadow-lg hover:bg-orange-900 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-orange-900"
                        href="#tools"
                    >
                        See Tools
                    </a>
                </div>
            </section>

            <section className="grid scroll-mt-8 gap-8 py-16 md:grid-cols-[0.75fr_1.25fr] md:items-start" id="tools" aria-labelledby="tools-heading">
                <div>
                    <p className="m-0 text-sm font-black uppercase leading-5 tracking-[0.22em] text-orange-900">Tools</p>
                    <h2 className="m-0 mt-3 text-balance font-serif text-4xl leading-tight tracking-[-0.03em] text-stone-950 sm:text-5xl" id="tools-heading">
                        The core PDF tasks stay easy to find.
                    </h2>
                </div>
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">{toolItems}</ul>
            </section>

            <section
                className="grid scroll-mt-8 gap-8 rounded-4xl bg-stone-950 p-8 text-stone-50 md:grid-cols-[0.85fr_1.15fr] md:p-10"
                id="privacy"
                aria-labelledby="privacy-heading"
            >
                <div>
                    <p className="m-0 text-sm font-black uppercase leading-5 tracking-[0.22em] text-stone-50">Privacy</p>
                    <h2 className="m-0 mt-3 text-balance font-serif text-4xl leading-tight tracking-[-0.03em] text-stone-50 sm:text-5xl" id="privacy-heading">
                        Documents should feel local, not lost.
                    </h2>
                </div>
                <p className="m-0 text-lg leading-8 text-stone-300">
                    Giovanni is designed around browser-side PDF work. When a file is processed, the interface should say what is happening and why.
                </p>
            </section>

            <section className="grid scroll-mt-8 gap-8 py-16 md:grid-cols-[0.75fr_1.25fr] md:items-start" id="principles" aria-labelledby="principles-heading">
                <div>
                    <p className="m-0 text-sm font-black uppercase leading-5 tracking-[0.22em] text-orange-900">Principles</p>
                    <h2 className="m-0 mt-3 text-balance font-serif text-4xl leading-tight tracking-[-0.03em] text-stone-950 sm:text-5xl" id="principles-heading">
                        Clear enough for a first visit, steady enough for daily use.
                    </h2>
                </div>
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">{principleItems}</ul>
            </section>
        </main>
    );
}

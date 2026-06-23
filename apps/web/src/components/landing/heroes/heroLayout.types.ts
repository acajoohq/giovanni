/** Shared props the hero layout accepts. */
export interface HeroLayoutProps {
    locale: string;
    onStart: () => void;
    /** "overlay" pins the hero behind the app card; "static" flows it as a stacked section. */
    variant?: "overlay" | "static";
}

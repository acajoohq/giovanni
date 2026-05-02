import { Tabs } from "@base-ui/react/tabs";
import { styled } from "@linaria/react";
import { motion } from "motion/react";
import type React from "react";
import type { CSSProperties } from "react";

export type Tool = {
    readonly id: string;
    readonly label: string;
    readonly shortLabel: string;
    readonly color: string;
    readonly title: string;
};

type ToolTabsListProps = {
    tools: readonly Tool[];
};

type ToolColorStyle = CSSProperties & {
    "--tool-color": string;
};

const folderTabSpring = {
    type: "spring",
    stiffness: 360,
    damping: 34,
    mass: 0.9,
} as const;

export const ToolTabsList = ({ tools }: ToolTabsListProps) => {
    return (
        <TabsScroller>
            <TabsList activateOnFocus aria-label="PDF tools">
                {tools.map((tool) => {
                    const toolColorStyle: ToolColorStyle = { "--tool-color": tool.color };

                    return (
                        <TabButton
                            key={tool.id}
                            render={(props: any, state: any) => {
                                const { onAnimationStart: _onAnimationStart, onDrag: _onDrag, onDragEnd: _onDragEnd, onDragStart: _onDragStart, ...motionProps } = props;

                                return (
                                    <motion.button
                                        {...motionProps}
                                        animate={{
                                            y: state.active ? 0 : 12,
                                        }}
                                        transition={folderTabSpring}
                                    />
                                );
                            }}
                            style={toolColorStyle}
                            value={tool.id}
                        >
                            <ShortLabel>{tool.shortLabel}</ShortLabel>
                            <Label>{tool.label}</Label>
                        </TabButton>
                    );
                })}
            </TabsList>
        </TabsScroller>
    );
};

const TabsScroller = styled.div`
    position: relative;
    padding: 0.5rem 1rem 3px;
    margin-bottom: -3px;
    overflow-x: auto;
    overflow-y: hidden;
`;

const TabsList = styled(Tabs.List as any)`
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: max-content;
    margin: 0;
    padding: 0 1rem 0 2rem;
    list-style: none;

    @media (max-width: 639px) {
        gap: 0.25rem;
        padding-left: 1rem;
    }
`;

const TabButton = styled(Tabs.Tab as any)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0.25rem;
    z-index: 1;
    min-width: 9.5rem;
    min-height: 4.5rem;
    padding: 1.25rem 1rem 0.75rem;
    touch-action: manipulation;
    color: #1c1917;
    text-align: left;
    background: var(--tool-color);
    border: 3px solid #1c1917;
    border-radius: 12px 12px 0 0;
    box-shadow: none;
    transform-origin: bottom center;
    will-change: transform;

    &:focus-visible {
        z-index: 30;
        outline: none;
        box-shadow: inset 0 0 0 3px #008fbe;
    }

    &:not([data-active]) {
        filter: saturate(0.9) brightness(0.95);
        cursor: pointer;
    }

    @media (min-width: 640px) {
        min-width: 11rem;
        padding-right: 1.25rem;
        padding-left: 1.25rem;
    }

    &[data-active] {
        z-index: 20;
        filter: none;
    }

    &[data-active]::after {
        position: absolute;
        right: -3px;
        bottom: -3px;
        left: -3px;
        height: 6px;
        content: "";
        background: inherit;
        border-right: 3px solid #1c1917;
        border-left: 3px solid #1c1917;
    }

    @media (hover: hover) {
        &:not([data-active]):hover {
            filter: saturate(1) brightness(1);
        }
    }
`;

const ShortLabel = styled.span`
    font-size: 0.65rem;
    font-family: ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", "Comfortaa", "Manjari", "Arial Rounded MT Bold", "Calibri", sans-serif;
    font-weight: 800;
    line-height: 1;
    color: #57534e;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    @media (min-width: 640px) {
        font-size: 0.7rem;
    }
`;

const Label = styled.span`
    font-size: 0.9rem;
    font-family: ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", "Comfortaa", "Manjari", "Arial Rounded MT Bold", "Calibri", sans-serif;
    font-weight: 900;
    line-height: 1.2;
    color: #1c1917;

    @media (min-width: 640px) {
        font-size: 1rem;
    }
`;

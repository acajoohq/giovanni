import { Tabs } from "@base-ui/react/tabs";
import { styled } from "@linaria/react";
import { motion } from "motion/react";
import type React from "react";
import { type CSSProperties, useState } from "react";
import { ToolTabsList, type Tool } from "./ToolTabsList";

type ToolColorStyle = CSSProperties & {
    "--tool-color": string;
};

const tools = [
    {
        id: "compress",
        label: "Compress PDF",
        shortLabel: "Compress",
        color: "#fde047",
        title: "Compress PDF",
    },
    {
        id: "split",
        label: "Split Pages",
        shortLabel: "Split",
        color: "#86efac",
        title: "Split Pages",
    },
    {
        id: "merge",
        label: "Merge PDFs",
        shortLabel: "Merge",
        color: "#fca5a5",
        title: "Merge PDFs",
    },
    {
        id: "images",
        label: "Extract Images",
        shortLabel: "Images",
        color: "#93c5fd",
        title: "Extract Images",
    },
] as const satisfies readonly Tool[];

const folderBodySpring = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
} as const;

export const HomePage = () => {
    const [activeToolId, setActiveToolId] = useState<(typeof tools)[number]["id"]>("compress");
    const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];
    const activeToolStyle: ToolColorStyle = { "--tool-color": activeTool.color };

    return (
        <Main id="main-content">
            <ProductSection aria-labelledby="product-title">
                <ScreenReaderOnly id="product-title">Local PDF tools</ScreenReaderOnly>

                <ToolsFolder id="tools" onValueChange={(value: any) => setActiveToolId(value as (typeof tools)[number]["id"])} value={activeToolId}>
                    <ToolTabsList tools={tools} />

                    <ToolPanelShell animate={{ backgroundColor: activeTool.color }} style={activeToolStyle} transition={folderBodySpring}>
                        {tools.map((tool) => (
                            <ToolPanel key={tool.id} value={tool.id}>
                                <ScreenReaderOnly as="h2">{tool.title}</ScreenReaderOnly>
                                <FolderInterior aria-hidden="true">
                                    <PaperTitle>{tool.label}</PaperTitle>
                                    <PaperSubtitle>Frugal PDF processing without the cloud</PaperSubtitle>
                                </FolderInterior>
                            </ToolPanel>
                        ))}
                    </ToolPanelShell>
                </ToolsFolder>
            </ProductSection>
        </Main>
    );
};

const Main = styled.main`
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    padding: 2rem 1rem;

    @media (min-width: 640px) {
        padding-right: 1.5rem;
        padding-left: 1.5rem;
        padding-top: 4rem;
    }
`;

const ProductSection = styled.section`
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 8rem);
`;

const ScreenReaderOnly = styled.h1`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    clip: rect(0, 0, 0, 0);
    border: 0;
`;

const ToolsFolder = styled(Tabs.Root as any)`
    display: block;
    margin-top: 0.25rem;
    scroll-margin-top: 2rem;
`;

const ToolPanelShell = styled(motion.div as any)`
    position: relative;
    z-index: 10;
    min-height: 34rem;
    padding: 2.5rem 1.25rem 1.25rem;
    margin-top: -3px;
    overflow: hidden;
    background: var(--tool-color);
    border: 3px solid #1c1917;
    border-radius: 12px;
    box-shadow: 10px 10px 0 #1c1917;

    @media (min-width: 640px) {
        padding: 3rem 1.75rem 1.75rem;
    }

    @media (min-width: 1024px) {
        padding: 3.25rem 2rem 2rem;
    }
`;

const ToolPanel = styled(Tabs.Panel as any)`
    outline: none;

    &:focus-visible {
        box-shadow: 0 0 0 3px #008fbe;
    }
`;

const FolderInterior = styled.div`
    position: relative;
    z-index: 1;
    min-height: 27rem;
    padding: 2.5rem 2rem 2.5rem 4.5rem;
    overflow: hidden;
    background-color: #f8fafc;
    background-image: repeating-linear-gradient(transparent, transparent calc(2.5rem - 2px), #bae6fd calc(2.5rem - 2px), #bae6fd 2.5rem);
    border: 3px solid #1c1917;
    border-radius: 8px;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 3.5rem;
        width: 3px;
        background-color: #fca5a5;
        z-index: 0;
    }
`;

const PaperTitle = styled.h3`
    position: relative;
    z-index: 2;
    margin: 0;
    font-family: "Courier New", Courier, monospace;
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 2.5rem;
    color: #1c1917;
    text-transform: uppercase;
    transform: translateY(2px);
`;

const PaperSubtitle = styled.p`
    position: relative;
    z-index: 2;
    margin: 0;
    font-family: "Courier New", Courier, monospace;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 2.5rem;
    color: #44403c;
    transform: translateY(2px);
`;

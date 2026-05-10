import { useTranslation } from "react-i18next";

export function ProcessingPlaceholder() {
    const { t } = useTranslation();
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-app-text-subtle">
            <div className="size-5 animate-spin rounded-full border-2 border-app-control-hover border-t-brand" />
            <span className="text-[12px]">{t("common.viewer.processing")}</span>
        </div>
    );
}

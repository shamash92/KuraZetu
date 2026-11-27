import {useTheme} from "next-themes";
import {Toaster as Sonner, ToasterProps} from "sonner";

const Toaster = ({...props}: ToasterProps) => {
    const {theme = "system"} = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--success-text": "var(--green-deep)",
                    "--success-bg": "var(--mint)",
                    "--success-border": "var(--green-deep)",
                    "--error-text": "var(--ink)",
                    "--error-bg": "var(--coral)",
                    "--error-border": "var(--coral-deep)",
                    "--info-text": "var(--periwinkle-deep)",
                    "--info-bg": "var(--periwinkle)",
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export {Toaster};

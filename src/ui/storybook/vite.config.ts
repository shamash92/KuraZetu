import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";

export default defineConfig({
    optimizeDeps: {
        include: [
            "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-label",
            "@radix-ui/react-slot", "react-hook-form", "sonner", "vaul", "next-themes",
            "react-leaflet", "leaflet", "@radix-ui/react-tabs", "lucide-react",
        ],
    },
    resolve: {
        alias: {"@": fileURLToPath(new URL("../", import.meta.url))},
    },
});

import {addons} from "storybook/manager-api";
import {create} from "storybook/theming";

// The logo links to "./" by default. Static hosts (Django's static files, S3)
// do not serve a folder index, so point it at the catalog's own page instead.
addons.setConfig({
    theme: create({
        base: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        brandUrl: "./index.html",
        brandTarget: "_self",
    }),
});

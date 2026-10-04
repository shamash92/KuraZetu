// Stands in for `react-markdown`, which Jest cannot load: shows the Markdown
// source as plain text instead of rendering it.
module.exports = {
    __esModule: true,
    default: ({children}) => children,
};
